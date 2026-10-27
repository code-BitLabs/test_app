import * as THREE from 'three';
import {
  createGlobeScene,
  isWebGlAvailable,
} from '@/features/spatial/globe/scene/globeScene';
import { createMoonSurface } from '@/features/spatial/globe/scene/globeSurfaceMaterial';
import { createLaserTracksGroup } from '@/features/spatial/globe/scene/globeLaserTracks';
import { createGraticuleGroup, createPolarFootprintGroup } from '@/features/spatial/globe/scene/globeGraticule';
import { createSiteMarkers } from '@/features/spatial/globe/scene/globeSiteMarkers';
import { createCameraTransitioner } from '@/features/spatial/globe/interaction/globeCameraPresets';
import { createMarkerPickingController } from '@/features/spatial/globe/interaction/globePicking';
import { createPolarTerrainFeatures } from '@/features/spatial/globe/scene/globePolarTerrain';
import { createLunarRoverController } from '@/features/spatial/globe/interaction/lunarRoverController';
import { CANDIDATE_SITES } from '@/domain/sites/catalog';
import { CameraPreset, ScientificMapLayerMode } from '@/features/spatial/model/spatialPreferences';
import { CustomLandingTarget } from '@/domain/target/customTargetModel';
import {
  createCustomTargetBeacon,
  updateCustomTargetBeacon,
  raycastMoonSurface,
} from './globePinpoint';
import {
  GlobeDiagnosticsMetrics,
  GlobeSceneHandle,
  GlobeSceneBuildInput,
} from './globeSceneBuilderTypes';
import { createGlobeSceneAnimator } from './globeSceneAnimator';

export type { GlobeDiagnosticsMetrics, GlobeSceneHandle, GlobeSceneBuildInput };

/** Used if the container has not laid out yet; the ResizeObserver corrects it immediately. */
const FALLBACK_CONTAINER_WIDTH = 500;
const FALLBACK_CONTAINER_HEIGHT = 450;

/**
 * Builds the WebGL globe: renderer, displaced LROC surface, line overlays,
 * candidate markers, pointer picking, the render loop and the resize binding.
 * Returns a handle that owns its own disposal.
 */
export function buildGlobeScene(input: GlobeSceneBuildInput): GlobeSceneHandle | null {
  const { container } = input;
  if (!isWebGlAvailable()) return null;

  const globe = createGlobeScene(
    container.clientWidth || FALLBACK_CONTAINER_WIDTH,
    container.clientHeight || FALLBACK_CONTAINER_HEIGHT,
  );
  container.appendChild(globe.renderer.domElement);

  const surface = createMoonSurface({
    onTextureSettled: input.onSurfaceSettled,
    onSurfaceUnavailable: input.onSurfaceUnavailable,
  });

  const globeGroup = new THREE.Group();
  globeGroup.add(surface.mesh);
  globe.scene.add(globeGroup);

  const footprintGroup = createPolarFootprintGroup();
  globeGroup.add(footprintGroup);

  const polarTerrain = createPolarTerrainFeatures(input.initialSelectedSiteId);
  globeGroup.add(polarTerrain.group);

  const graticuleGroup = createGraticuleGroup();
  globeGroup.add(graticuleGroup);

  const vectorsGroup = new THREE.Group();
  globeGroup.add(vectorsGroup);

  const laserTracks = createLaserTracksGroup();
  globeGroup.add(laserTracks.group);

  const { markers, hitTargets } = createSiteMarkers(input.initialSelectedSiteId);
  markers.forEach((marker) => globeGroup.add(marker.container));

  const picking = createMarkerPickingController(container, globe.renderer.domElement, globe.camera, hitTargets, {
    onHoverEnter: (site) => {
      // Unselected badges reveal on hover; the selected site's badge is always drawn.
      const marker = markers.get(site.id);
      if (marker && !marker.badge.visible) marker.badge.visible = true;
      input.onHoverChange(site);
    },
    onHoverExit: (siteId) => {
      const marker = markers.get(siteId);
      if (marker && !input.isSiteSelected(siteId)) marker.badge.visible = false;
      input.onHoverChange(null);
    },
    onHoverCursorChange: (isPointer) => {
      container.style.cursor = isPointer ? 'pointer' : 'grab';
    },
    onPick: input.onPick,
  });
  picking.attach();

  const transitioner = createCameraTransitioner();
  let currentSelectedSiteId = input.initialSelectedSiteId;
  let currentCameraPreset: CameraPreset = 'nadir';
  let displayOptions = { showMarkers: true, showLabels: true, showTerrain: true };
  let layerVisibility = { showGrid: true, showShadowRegions: true };
  let isVectorsEnabled = true;
  let isFlyoverEnabled = false;

  const initialCandidateSite =
    CANDIDATE_SITES.find((s) => s.id === input.initialSelectedSiteId) || CANDIDATE_SITES[0];
  const roverController = createLunarRoverController(container, initialCandidateSite);
  roverController.attach();

  // User manual drag/orbit immediately interrupts in-flight camera transitions and flyover
  const handleControlsStart = () => {
    transitioner.cancel();
    if (isFlyoverEnabled) {
      isFlyoverEnabled = false;
      input.onFlyoverInterrupted?.();
    }
  };
  globe.controls.addEventListener('start', handleControlsStart);

  const animator = createGlobeSceneAnimator({
    globe,
    container,
    polarTerrain,
    roverController,
    transitioner,
    markers,
    graticuleGroup,
    footprintGroup,
    vectorsGroup,
    getCurrentSelectedSiteId: () => currentSelectedSiteId,
    getCurrentCameraPreset: () => currentCameraPreset,
    getDisplayOptions: () => displayOptions,
    getLayerVisibility: () => layerVisibility,
    getIsVectorsEnabled: () => isVectorsEnabled,
    getIsFlyoverEnabled: () => isFlyoverEnabled,
    onRoverTelemetryChange: input.onRoverTelemetryChange,
  });
  animator.start();

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        globe.camera.aspect = width / height;
        globe.camera.updateProjectionMatrix();
        globe.renderer.setSize(width, height);
        if (globe.composer) {
          globe.composer.setSize(width, height);
        }
      }
    }
  });
  resizeObserver.observe(container);

  let customBeacon: THREE.Group | null = null;

  return {
    globe,
    surfaceMesh: surface.mesh,
    graticuleGroup,
    footprintGroup,
    vectorsGroup,
    markers,
    transitioner,
    setCustomTarget: (target: CustomLandingTarget | null) => {
      if (!target) {
        if (customBeacon) customBeacon.visible = false;
        return;
      }
      if (!customBeacon) {
        customBeacon = createCustomTargetBeacon(target);
        globe.scene.add(customBeacon);
      } else {
        updateCustomTargetBeacon(customBeacon, target);
      }
    },
    raycastMoonSurface: (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      const mouse = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, globe.camera);
      return raycastMoonSurface(raycaster, surface.mesh);
    },
    setSelectedSiteId: (id: string) => {
      currentSelectedSiteId = id;
      polarTerrain.updateSelectedSite(id);
      const targetSite = CANDIDATE_SITES.find((s) => s.id === id) || CANDIDATE_SITES[0];
      if (roverController.isActive()) {
        roverController.resetToSite(targetSite);
      }
    },
    setScientificMode: (mode: ScientificMapLayerMode) => {
      polarTerrain.setScientificMode(mode);
      surface.setScientificMode(mode);
    },
    setCameraPreset: (preset: CameraPreset) => {
      currentCameraPreset = preset;
      const targetSite = CANDIDATE_SITES.find((s) => s.id === currentSelectedSiteId) || CANDIDATE_SITES[0];
      if (roverController.isActive()) {
        roverController.setActive(false);
        input.onRoverTelemetryChange?.(null);
        globe.controls.enabled = true;
      }
      transitioner.moveTo(preset, targetSite);
    },
    setRoverActive: (active: boolean) => {
      const targetSite = CANDIDATE_SITES.find((s) => s.id === currentSelectedSiteId) || CANDIDATE_SITES[0];
      if (active) {
        currentCameraPreset = 'horizon';
        transitioner.cancel();
        globe.controls.enabled = false;
        roverController.resetToSite(targetSite);
        roverController.setActive(true);
        globe.camera.near = 0.0002;
        globe.camera.updateProjectionMatrix();
      } else {
        roverController.setActive(false);
        input.onRoverTelemetryChange?.(null);
        globe.controls.enabled = true;
        transitioner.moveTo('horizon', targetSite);
      }
    },
    isRoverActive: () => roverController.isActive(),
    setDisplayOptions: (opts: { showMarkers?: boolean; showLabels?: boolean; showTerrain?: boolean }) => {
      displayOptions = { ...displayOptions, ...opts };
      if (opts.showTerrain !== undefined) {
        surface.mesh.visible = opts.showTerrain;
        polarTerrain.group.visible = opts.showTerrain;
      }
    },
    setLayerVisibility: (showGrid: boolean, showShadowRegions: boolean) => {
      layerVisibility = { showGrid, showShadowRegions };
      const dist = globe.camera.position.distanceTo(globe.controls.target);
      const isDeep = dist < 0.65;
      graticuleGroup.visible = !isDeep && showGrid;
      footprintGroup.visible = !isDeep && showShadowRegions;
    },
    setVectorsVisibility: (showVectors: boolean) => {
      isVectorsEnabled = showVectors;
      const dist = globe.camera.position.distanceTo(globe.controls.target);
      const isDeep = dist < 0.65;
      vectorsGroup.visible = !isDeep && showVectors;
    },
    setLaserTracksVisible: (visible: boolean) => {
      laserTracks.setVisible(visible);
    },
    setFlyover: (active?: boolean) => {
      isFlyoverEnabled = active !== undefined ? active : !isFlyoverEnabled;
    },
    isFlyoverActive: () => isFlyoverEnabled,
    getDiagnostics: () => animator.getDiagnostics(),
    dispose: () => {
      roverController.detach();
      animator.stop();
      resizeObserver.disconnect();
      picking.detach();
      globe.controls.removeEventListener('start', handleControlsStart);
      if (container.contains(globe.renderer.domElement)) {
        container.removeChild(globe.renderer.domElement);
      }
      globe.controls.dispose();
      globe.renderer.dispose();
      if (globe.starfield) {
        globe.starfield.geometry.dispose();
        (globe.starfield.material as THREE.Material).dispose();
      }
      surface.dispose();
      polarTerrain.dispose();
      laserTracks.dispose();
      if (customBeacon) {
        globe.scene.remove(customBeacon);
        customBeacon = null;
      }
    },
  };
}
