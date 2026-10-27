import * as THREE from 'three';
import { MOON_SCENE_RADIUS, GlobeScene, isSoftwareGl } from '@/features/spatial/globe/scene/globeScene';
import { SiteMarker, applyMarkerHorizonOcclusion } from '@/features/spatial/globe/scene/globeSiteMarkers';
import { CameraTransitioner } from '@/features/spatial/globe/interaction/globeCameraPresets';
import { createPolarTerrainFeatures } from '@/features/spatial/globe/scene/globePolarTerrain';
import { calculate3DOrbitSensitivity } from '@/features/spatial/interaction/zoomAwareInteractionModel';
import { LunarRoverController, RoverTelemetry } from '@/features/spatial/globe/interaction/lunarRoverController';
import { CameraPreset } from '@/features/spatial/model/spatialPreferences';
import { GlobeDiagnosticsMetrics } from './globeSceneBuilderTypes';

const FALLBACK_CONTAINER_HEIGHT = 450;

export interface GlobeAnimatorContext {
  globe: GlobeScene;
  container: HTMLDivElement;
  polarTerrain: ReturnType<typeof createPolarTerrainFeatures>;
  roverController: LunarRoverController;
  transitioner: CameraTransitioner;
  markers: Map<string, SiteMarker>;
  graticuleGroup: THREE.Group;
  footprintGroup: THREE.Group;
  vectorsGroup: THREE.Group;
  getCurrentSelectedSiteId: () => string;
  getCurrentCameraPreset: () => CameraPreset;
  getDisplayOptions: () => { showMarkers: boolean; showLabels: boolean; showTerrain: boolean };
  getLayerVisibility: () => { showGrid: boolean; showShadowRegions: boolean };
  getIsVectorsEnabled: () => boolean;
  getIsFlyoverEnabled: () => boolean;
  onRoverTelemetryChange?: (telemetry: RoverTelemetry | null) => void;
}

export function createGlobeSceneAnimator(ctx: GlobeAnimatorContext) {
  const {
    globe,
    container,
    polarTerrain,
    roverController,
    transitioner,
    markers,
    graticuleGroup,
    footprintGroup,
    vectorsGroup,
    getCurrentSelectedSiteId,
    getCurrentCameraPreset,
    getDisplayOptions,
    getLayerVisibility,
    getIsVectorsEnabled,
    getIsFlyoverEnabled,
    onRoverTelemetryChange,
  } = ctx;

  const occlusionScratch = new THREE.Vector3();
  const flyoverAxis = new THREE.Vector3();
  let animationId = 0;
  let timerId: number | null = null;
  const frameTimes: number[] = [];
  let lastFrameTimestamp = performance.now();
  let lastStatsUpdate = performance.now();

  let cachedMetrics: GlobeDiagnosticsMetrics = {
    fps: 60,
    frameTimeMs: 16.6,
    frameTimeP95Ms: 16.6,
    drawCalls: 0,
    triangles: 0,
    cameraDistance: 4.8,
    cameraTargetDistance: 0,
    cameraNear: 0.05,
    pixelRatio: globe.renderer.getPixelRatio(),
    isSoftwareGl,
  };

  function afterDraw(cb: () => void) {
    const gl = globe.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      timerId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        timerId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        timerId = window.setTimeout(cb, 80);
      }
    };
    timerId = window.setTimeout(poll, 5);
  }

  const animate = () => {
    const now = performance.now();
    const dt = now - lastFrameTimestamp;
    lastFrameTimestamp = now;
    if (dt > 0 && dt < 200) {
      frameTimes.push(dt);
      if (frameTimes.length > 60) frameTimes.shift();
    }

    if (now - lastStatsUpdate > 250) {
      lastStatsUpdate = now;
      if (frameTimes.length > 0) {
        const sorted = [...frameTimes].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length * 0.5)];
        const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? median;
        const avgDt = frameTimes.reduce((sum, v) => sum + v, 0) / frameTimes.length;
        cachedMetrics = {
          fps: Math.round(1000 / (avgDt || 16.6)),
          frameTimeMs: Math.round(median * 10) / 10,
          frameTimeP95Ms: Math.round(p95 * 10) / 10,
          drawCalls: globe.renderer.info.render.calls,
          triangles: globe.renderer.info.render.triangles,
          cameraDistance: Math.round(globe.camera.position.length() * 100) / 100,
          cameraTargetDistance: Math.round(globe.camera.position.distanceTo(globe.controls.target) * 100) / 100,
          cameraNear: globe.camera.near,
          pixelRatio: globe.renderer.getPixelRatio(),
          isSoftwareGl,
          terrainLod: polarTerrain.getTerrainDiagnostics().currentLOD,
          terrainDemSource: polarTerrain.getTerrainDiagnostics().sourceDem,
          terrainEffectiveResolution: polarTerrain.getTerrainDiagnostics().effectiveResolution,
          orbitRotateSpeed: Math.round(globe.controls.rotateSpeed * 1000) / 1000,
          orbitDamping: Math.round(globe.controls.dampingFactor * 1000) / 1000,
        };
      }
    }

    const currentSelectedSiteId = getCurrentSelectedSiteId();
    const currentCameraPreset = getCurrentCameraPreset();
    const displayOptions = getDisplayOptions();
    const layerVisibility = getLayerVisibility();
    const isVectorsEnabled = getIsVectorsEnabled();
    const isFlyoverEnabled = getIsFlyoverEnabled();

    // First-Person Rover Exploration Mode
    if (roverController.isActive()) {
      const dtSec = Math.max(0.001, Math.min(0.1, dt / 1000.0));
      const telemetry = roverController.update(dtSec, globe.camera);
      onRoverTelemetryChange?.(telemetry);

      if (Math.abs(globe.camera.near - 0.0002) > 0.0001) {
        globe.camera.near = 0.0002;
        globe.camera.updateProjectionMatrix();
      }

      graticuleGroup.visible = false;
      footprintGroup.visible = false;
      vectorsGroup.visible = false;
      polarTerrain.setCraterOutlinesVisible(false);

      applyMarkerHorizonOcclusion(
        markers,
        globe.camera.position,
        globe.camera.position,
        currentSelectedSiteId,
        occlusionScratch,
        displayOptions,
      );

      if (globe.composer) {
        globe.composer.render();
      } else {
        globe.renderer.render(globe.scene, globe.camera);
      }
      if (isSoftwareGl) {
        afterDraw(animate);
      } else {
        animationId = requestAnimationFrame(animate);
      }
      return;
    }

    // Step scripted camera move
    transitioner.step(globe.camera, globe.controls);

    // Guided reconnaissance flyover: smooth circular orbit around target terrain
    if (isFlyoverEnabled && !transitioner.isTransitioning()) {
      flyoverAxis.copy(globe.camera.up).normalize();
      if (flyoverAxis.lengthSq() < 0.1) flyoverAxis.set(0, 1, 0);

      const offset = globe.camera.position.clone().sub(globe.controls.target);
      offset.applyAxisAngle(flyoverAxis, 0.0035);
      globe.camera.position.copy(globe.controls.target).add(offset);
      globe.controls.update();
    }

    // Anti-penetration collision guard: sample true measured LOLA elevation
    const camPos = globe.camera.position;
    const camDist = camPos.length();
    let minSafeRadius = MOON_SCENE_RADIUS + 0.0035;
    if (camDist > 0.01 && !transitioner.isTransitioning()) {
      const phi = Math.acos(Math.max(-1, Math.min(1, camPos.y / camDist)));
      const camLatDeg = 90 - (phi * 180) / Math.PI;
      let camLonDeg = (Math.atan2(camPos.x, camPos.z) * 180) / Math.PI;
      if (camLonDeg < 0) camLonDeg += 360;

      const localElevMeters = polarTerrain.multiLodTerrain.getSurfaceElevationAt(camLatDeg, camLonDeg);
      const localElevUnits = (localElevMeters / 1000.0) * (MOON_SCENE_RADIUS / 1737.4);
      minSafeRadius = MOON_SCENE_RADIUS + localElevUnits + 0.0035;
      if (camDist < minSafeRadius) {
        camPos.setLength(minSafeRadius);
      }
    }

    // Dynamic scale-aware target distance calculation
    const targetLen = globe.controls.target.length();
    const isMoonCentric = targetLen < 0.6;
    const rawDistToTarget = globe.camera.position.distanceTo(globe.controls.target);
    const surfaceAltitude = Math.max(0.015, camDist - minSafeRadius);
    const distToTarget = isMoonCentric ? surfaceAltitude : rawDistToTarget;

    const minOrbitDist = isMoonCentric ? minSafeRadius + 0.005 : 0.015;
    if (Math.abs(globe.controls.minDistance - minOrbitDist) > 0.001) {
      globe.controls.minDistance = minOrbitDist;
    }

    polarTerrain.updateLOD(distToTarget);

    const sensitivity = calculate3DOrbitSensitivity(distToTarget, container.clientHeight || FALLBACK_CONTAINER_HEIGHT);
    globe.controls.rotateSpeed = sensitivity.rotateSpeed;
    globe.controls.panSpeed = sensitivity.panSpeed;
    globe.controls.dampingFactor = sensitivity.dampingFactor;
    if (typeof (globe.controls as any).zoomSpeed === 'number') {
      (globe.controls as any).zoomSpeed = sensitivity.zoomSpeed;
    }

    const isDeepZoom = distToTarget < 0.65;
    graticuleGroup.visible = !isDeepZoom && layerVisibility.showGrid;
    footprintGroup.visible = !isDeepZoom && layerVisibility.showShadowRegions;

    const isLocalPreset =
      currentCameraPreset === 'overhead' ||
      currentCameraPreset === 'horizon' ||
      currentCameraPreset === 'inspection' ||
      currentCameraPreset === 'site';
    vectorsGroup.visible = !isDeepZoom && !isLocalPreset && isVectorsEnabled;
    polarTerrain.setCraterOutlinesVisible(!isDeepZoom && !isLocalPreset);

    const targetNear = distToTarget < 0.25 ? 0.002 : distToTarget < 0.8 ? 0.01 : 0.05;
    if (Math.abs(globe.camera.near - targetNear) > 0.0005) {
      globe.camera.near = targetNear;
      globe.camera.updateProjectionMatrix();
    }

    applyMarkerHorizonOcclusion(
      markers,
      globe.camera.position,
      globe.controls.target,
      currentSelectedSiteId,
      occlusionScratch,
      displayOptions,
    );
    if (!transitioner.isTransitioning()) {
      globe.controls.update();
    }
    if (globe.composer) {
      globe.composer.render();
    } else {
      globe.renderer.render(globe.scene, globe.camera);
    }

    if (isSoftwareGl) {
      afterDraw(animate);
    } else {
      animationId = requestAnimationFrame(animate);
    }
  };

  return {
    start: () => {
      if (isSoftwareGl) {
        afterDraw(animate);
      } else {
        animationId = requestAnimationFrame(animate);
      }
    },
    stop: () => {
      cancelAnimationFrame(animationId);
      if (timerId !== null) clearTimeout(timerId);
    },
    getDiagnostics: () => cachedMetrics,
  };
}
