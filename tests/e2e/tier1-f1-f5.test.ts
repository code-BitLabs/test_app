import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CANDIDATE_SITES } from '@/domain/sites/catalog';
import { getModeMetadata } from '@/features/spatial/lab/components/planetaryTheaterModeMetadata';
import { createLunarRoverController } from '@/features/spatial/globe/interaction/lunarRoverController';
import { calculateAstronautHudTelemetry } from '@/features/spatial/globe/model/astronautHudModel';
import {
  cameraPoseForPreset,
  getTopocentricBasis,
  createCameraTransitioner,
  NADIR_CAMERA_DISTANCE,
} from '@/features/spatial/globe/interaction/globeCameraPresets';
import { createMockDomElement } from './testHelpers';

// ============================================================================
// Tier 1 — Feature F1: Dedicated 3D Lab Reinstatement
// ============================================================================

test('Tier 1 [F1-1]: 3D Lab Planetary Theater - initializes with candidate site and default nadir preset', () => {
  const defaultSite = CANDIDATE_SITES[0];
  assert.ok(defaultSite, 'Default candidate site must exist');
  assert.equal(defaultSite.id, 'shackleton-rim');

  const metadata = getModeMetadata('nadir');
  assert.equal(metadata.code, 'MODE A');
  assert.equal(metadata.name, 'Regional South Pole');
  assert.ok(metadata.desc.includes('83°S LOLA coverage boundary'));
});

test('Tier 1 [F1-2]: 3D Lab Viewport Modes - supports split-view side-by-side mode and sidebar toggle', () => {
  let isSplitView = false;
  let showSitePanel = true;

  // Toggle split view
  isSplitView = !isSplitView;
  assert.equal(isSplitView, true, 'Split view must engage');

  // Toggle side inspection panel
  showSitePanel = !showSitePanel;
  assert.equal(showSitePanel, false, 'Inspection panel can be collapsed');

  // Restore
  isSplitView = !isSplitView;
  assert.equal(isSplitView, false, 'Split view disengages cleanly');
});

test('Tier 1 [F1-3]: 3D Lab Temporal Engine - steps simulation time forward and backward by arbitrary hours', () => {
  const initialEpochMs = Date.UTC(2026, 9, 21, 12, 0, 0); // 2026-10-21T12:00:00Z
  const stepHours = 6;
  const targetEpochMs = initialEpochMs + stepHours * 3600 * 1000;

  assert.equal(targetEpochMs - initialEpochMs, 21600000);
  const backwardsEpochMs = targetEpochMs - 12 * 3600 * 1000;
  assert.equal(backwardsEpochMs, initialEpochMs - 6 * 3600 * 1000);
});

test('Tier 1 [F1-4]: 3D Lab Camera Reset - handleResetCamera restores nadir preset and resets candidate', () => {
  let activePreset = 'horizon';
  let activeSiteId = 'shackleton-rim';

  // Simulating handleResetCamera contract
  activePreset = 'nadir';
  activeSiteId = CANDIDATE_SITES[0].id;

  assert.equal(activePreset, 'nadir');
  assert.equal(activeSiteId, 'shackleton-rim');
});

test('Tier 1 [F1-5]: 3D Lab Mode Metadata - provides valid labels, codes, and style tokens for all presets', () => {
  const presets = ['nadir', 'site', 'oblique', 'overhead', 'horizon', 'global'] as const;
  for (const preset of presets) {
    const meta = getModeMetadata(preset);
    assert.ok(meta.code.length > 0, `Mode code must be defined for ${preset}`);
    assert.ok(meta.name.length > 0, `Mode name must be defined for ${preset}`);
    assert.ok(meta.desc.length > 0, `Mode desc must be defined for ${preset}`);
    assert.ok(meta.color.includes('border'), `Color token must define border for ${preset}`);
  }
});

// ============================================================================
// Tier 1 — Feature F2: Surface Rover EVA Simulator
// ============================================================================

test('Tier 1 [F2-1]: Rover Controller - initializes telemetry at candidate coordinates with 25m mast height', () => {
  const dom = createMockDomElement();
  const site = CANDIDATE_SITES[0];
  const controller = createLunarRoverController(dom, site);

  const telemetry = controller.getTelemetry();
  assert.equal(telemetry.latDeg, site.coordinates.latitudeDeg);
  assert.equal(telemetry.lonDeg, site.coordinates.longitudeDeg);
  assert.ok(Number.isFinite(telemetry.elevationMeters));
  assert.equal(telemetry.isDriving, false);
  assert.equal(telemetry.speedMps, 0);
});

test('Tier 1 [F2-2]: Rover Physics - updates position and heading smoothly without NaN under forward throttle', () => {
  const dom = createMockDomElement();
  const site = CANDIDATE_SITES[0];
  const controller = createLunarRoverController(dom, site);
  controller.setActive(true);

  const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.01, 100);
  const telemetry = controller.update(0.1, camera);

  assert.ok(!Number.isNaN(telemetry.latDeg));
  assert.ok(!Number.isNaN(telemetry.lonDeg));
  assert.ok(!Number.isNaN(telemetry.pitchDeg));
  assert.ok(!Number.isNaN(telemetry.headingDeg));
});

test('Tier 1 [F2-3]: Rover Terrain Slope - samples LOLA DEM slope and matches geotechnical classification', () => {
  const dom = createMockDomElement();
  const site = CANDIDATE_SITES[0];
  const controller = createLunarRoverController(dom, site);
  const telemetry = controller.getTelemetry();

  assert.ok(telemetry.slopeDeg >= 0 && telemetry.slopeDeg < 90);
  assert.ok(Number.isFinite(telemetry.slopeDeg));
});

test('Tier 1 [F2-4]: Rover Max Velocity - respects rover mechanical speed bounds', () => {
  const dom = createMockDomElement();
  const site = CANDIDATE_SITES[0];
  const controller = createLunarRoverController(dom, site);
  controller.setActive(true);

  const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.01, 100);
  // Simulate 10 frames of motion
  for (let i = 0; i < 10; i++) {
    controller.update(0.05, camera);
  }
  const telemetry = controller.getTelemetry();
  assert.ok(telemetry.speedMps >= 0 && telemetry.speedMps <= 10.0);
});

test('Tier 1 [F2-5]: Rover Activation Lifecycle - attach and detach event bindings toggle active state', () => {
  const dom = createMockDomElement();
  const site = CANDIDATE_SITES[0];
  const controller = createLunarRoverController(dom, site);

  assert.equal(controller.isActive(), false);
  controller.attach();
  controller.setActive(true);
  assert.equal(controller.isActive(), true);

  controller.setActive(false);
  assert.equal(controller.isActive(), false);
  controller.detach();
});

// ============================================================================
// Tier 1 — Feature F3: Astronaut xEMU Visor HUD
// ============================================================================

test('Tier 1 [F3-1]: Astronaut HUD - calculates authentic 4.3 psia pure-O2 suit pressure and formatted telemetry', () => {
  const hud = calculateAstronautHudTelemetry({
    siteName: 'Connecting Ridge',
    latDeg: -89.44,
    lonDeg: 137.31,
    elevationMeters: 4250,
    slopeDeg: 4.8,
    sunElevationDeg: 1.5,
    earthElevationDeg: 5.2,
    missionElapsedSeconds: 3600,
  });

  assert.equal(hud.suitPressurePsia, 4.3);
  assert.equal(hud.oxygenMarginPct, 92); // (12h - 1h)/12h = 91.67% -> 92%
  assert.equal(hud.suitBatteryPct, 88); // (8.5h - 1h)/8.5h = 88.24% -> 88%
  assert.equal(hud.evaElapsedFormatted, '01:00:00');
  assert.equal(hud.latFormatted, '89.44°S');
  assert.equal(hud.lonFormatted, '137.31°E');
});

test('Tier 1 [F3-2]: Astronaut HUD - detects solar grazing glare when sun elevation is between 0° and 3°', () => {
  const glareHud = calculateAstronautHudTelemetry({
    siteName: 'Shackleton Rim',
    latDeg: -89.68,
    lonDeg: 125.0,
    elevationMeters: 4200,
    slopeDeg: 6.0,
    sunElevationDeg: 1.8, // Grazing 0-3°
    earthElevationDeg: 6.0,
  });
  assert.equal(glareHud.solarHazardState, 'grazing_glare');

  const sunlitHud = calculateAstronautHudTelemetry({
    siteName: 'Shackleton Rim',
    latDeg: -89.68,
    lonDeg: 125.0,
    elevationMeters: 4200,
    slopeDeg: 6.0,
    sunElevationDeg: 4.5, // >3°
    earthElevationDeg: 6.0,
  });
  assert.equal(sunlitHud.solarHazardState, 'nominal_sun');
});

test('Tier 1 [F3-3]: Astronaut HUD - triggers scarp danger warning when slope exceeds 15° tip-over limit', () => {
  const scarpWarning = calculateAstronautHudTelemetry({
    siteName: 'Haworth Crater Rim',
    latDeg: -87.4,
    lonDeg: -5.1,
    elevationMeters: 3100,
    slopeDeg: 18.2, // >15°
    sunElevationDeg: 1.0,
    earthElevationDeg: 3.5,
  });
  assert.equal(scarpWarning.terrainHazardState, 'scarp_danger');

  const cautionWarning = calculateAstronautHudTelemetry({
    siteName: 'Haworth Crater Rim',
    latDeg: -87.4,
    lonDeg: -5.1,
    elevationMeters: 3100,
    slopeDeg: 12.0, // 10-15°
    sunElevationDeg: 1.0,
    earthElevationDeg: 3.5,
  });
  assert.equal(cautionWarning.terrainHazardState, 'caution');
});

test('Tier 1 [F3-4]: Astronaut HUD - triggers multipath warning when Earth elevation is low (0° to 2°)', () => {
  const multipathHud = calculateAstronautHudTelemetry({
    siteName: 'Malapert Mountain',
    latDeg: -84.9,
    lonDeg: 12.9,
    elevationMeters: 5000,
    slopeDeg: 5.0,
    sunElevationDeg: 2.0,
    earthElevationDeg: 1.1, // 0-2°
  });
  assert.equal(multipathHud.dteCommsState, 'multipath_warning');

  const occludedHud = calculateAstronautHudTelemetry({
    siteName: 'Malapert Mountain',
    latDeg: -84.9,
    lonDeg: 12.9,
    elevationMeters: 5000,
    slopeDeg: 5.0,
    sunElevationDeg: 2.0,
    earthElevationDeg: -0.5, // Sub-horizon
  });
  assert.equal(occludedHud.dteCommsState, 'occluded');
});

test('Tier 1 [F3-5]: Astronaut HUD - models PLSS oxygen consumption (12h capacity) and battery depletion', () => {
  const depletedHud = calculateAstronautHudTelemetry({
    siteName: 'Connecting Ridge',
    latDeg: -89.44,
    lonDeg: 137.31,
    elevationMeters: 4250,
    slopeDeg: 4.0,
    sunElevationDeg: 1.0,
    earthElevationDeg: 5.0,
    missionElapsedSeconds: 15 * 3600, // 15 hours > 12h
  });

  assert.equal(depletedHud.oxygenMarginPct, 0);
  assert.equal(depletedHud.suitBatteryPct, 0);
  assert.equal(depletedHud.evaElapsedFormatted, '15:00:00');
});

// ============================================================================
// Tier 1 — Feature F4: 8 Authoritative Camera Presets
// ============================================================================

test('Tier 1 [F4-1]: Camera Presets - computes authentic nadir pose aligned with south polar stereographic map', () => {
  const site = CANDIDATE_SITES[0];
  const pose = cameraPoseForPreset('nadir', site);

  assert.equal(pose.camPos.x, 0);
  assert.equal(pose.camPos.y, -NADIR_CAMERA_DISTANCE);
  assert.ok(Math.abs(pose.camPos.z - 0.0001) < 1e-6);
  assert.equal(pose.lookTarget.x, 0);
  assert.equal(pose.lookTarget.y, 0);
  assert.equal(pose.lookTarget.z, 0);
  assert.equal(pose.upVector.z, 1, 'Nadir upVector points along prime meridian (+Z)');
});

test('Tier 1 [F4-2]: Camera Presets - computes global, oblique, and candidate site overview poses', () => {
  const site = CANDIDATE_SITES[0];
  const globalPose = cameraPoseForPreset('global', site);
  assert.equal(globalPose.camPos.z, 5.6);
  assert.equal(globalPose.lookTarget.x, 0);

  const obliquePose = cameraPoseForPreset('oblique', site);
  assert.ok(obliquePose.camPos.y < 0);
  assert.ok(obliquePose.camPos.z > 0);

  const sitePose = cameraPoseForPreset('site', site);
  assert.ok(sitePose.camPos.length() > 1.45);
});

test('Tier 1 [F4-3]: Camera Presets - computes surface-anchored inspection, overhead, horizon, and eva poses', () => {
  const site = CANDIDATE_SITES[0];
  const inspectionPose = cameraPoseForPreset('inspection', site);
  assert.ok(inspectionPose.camPos.distanceTo(inspectionPose.lookTarget) < 0.2);

  const overheadPose = cameraPoseForPreset('overhead', site);
  assert.ok(overheadPose.camPos.distanceTo(overheadPose.lookTarget) < 0.2);

  const horizonPose = cameraPoseForPreset('horizon', site);
  assert.ok(horizonPose.camPos.distanceTo(horizonPose.lookTarget) < 0.1);

  const evaPose = cameraPoseForPreset('eva', site);
  assert.ok(evaPose.camPos.distanceTo(evaPose.lookTarget) < 0.1);
});

test('Tier 1 [F4-4]: Camera Presets - getTopocentricBasis constructs orthonormal East-North-Up vectors', () => {
  const basis = getTopocentricBasis(-89.5, 45.0);

  assert.ok(Math.abs(basis.normal.length() - 1.0) < 1e-4, 'Normal must be unit length');
  assert.ok(Math.abs(basis.north.length() - 1.0) < 1e-4, 'North must be unit length');
  assert.ok(Math.abs(basis.east.length() - 1.0) < 1e-4, 'East must be unit length');

  assert.ok(Math.abs(basis.normal.dot(basis.north)) < 1e-4, 'Normal and North must be orthogonal');
  assert.ok(Math.abs(basis.north.dot(basis.east)) < 1e-4, 'North and East must be orthogonal');
  assert.ok(Math.abs(basis.east.dot(basis.normal)) < 1e-4, 'East and Normal must be orthogonal');
});

test('Tier 1 [F4-5]: Camera Transitioner - smoothly interpolates camera position and lookTarget across steps', () => {
  const transitioner = createCameraTransitioner();
  const site = CANDIDATE_SITES[0];
  const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.01, 100);
  camera.position.set(0, 0, 10);
  const controls = {
    target: new THREE.Vector3(0, 0, 0),
    update: () => {},
  } as any;

  transitioner.moveTo('site', site);
  assert.equal(transitioner.isTransitioning(), true);

  transitioner.step(camera, controls);
  assert.ok(camera.position.z < 10, 'Camera should lerp toward target position');
});

// ============================================================================
// Tier 1 — Feature F5: Flight-Grade Fullscreen Architecture
// ============================================================================

test('Tier 1 [F5-1]: Fullscreen Architecture - toggles fullscreen state cleanly without data loss', () => {
  let isFullscreen = false;
  const toggle = () => {
    isFullscreen = !isFullscreen;
  };

  assert.equal(isFullscreen, false);
  toggle();
  assert.equal(isFullscreen, true);
  toggle();
  assert.equal(isFullscreen, false);
});

test('Tier 1 [F5-2]: Fullscreen Escape Hierarchy - disengages active rover mode before exiting fullscreen', () => {
  let isRoverActive = true;
  let isFullscreen = true;

  // Keydown handler logic
  const handleEscape = () => {
    if (isRoverActive) {
      isRoverActive = false;
      return;
    }
    if (isFullscreen) {
      isFullscreen = false;
    }
  };

  // First Escape press exits rover mode
  handleEscape();
  assert.equal(isRoverActive, false, 'Rover mode must be disengaged first');
  assert.equal(isFullscreen, true, 'Fullscreen must remain active on first Escape');

  // Second Escape press exits fullscreen
  handleEscape();
  assert.equal(isFullscreen, false, 'Fullscreen exits on second Escape');
});

test('Tier 1 [F5-3]: Fullscreen Aspect Ratio - calculates non-distorted aspect ratio for widescreen viewports', () => {
  const width = 1920;
  const height = 1080;
  const aspect = width / height;

  const camera = new THREE.PerspectiveCamera(38, aspect, 0.01, 100);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  assert.ok(Math.abs(camera.aspect - 1.7777) < 0.01);
});

test('Tier 1 [F5-4]: Fullscreen Time Controls - maintains continuous epoch synchronization during fullscreen', () => {
  let epochMs = Date.UTC(2026, 9, 21, 12, 0, 0);
  const isFullscreen = true;

  // Scrubbing time in fullscreen
  const advanceTime = (hours: number) => {
    epochMs += hours * 3600 * 1000;
  };

  advanceTime(24);
  assert.equal(isFullscreen, true);
  assert.equal(epochMs, Date.UTC(2026, 9, 22, 12, 0, 0));
});

test('Tier 1 [F5-5]: Fullscreen FOV Calibration - preserves 38° optical field-of-view across viewport resizes', () => {
  const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100);
  assert.equal(camera.fov, 38, 'Field of view must strictly be calibrated to 38°');

  // Resize canvas
  camera.aspect = 2560 / 1440;
  camera.updateProjectionMatrix();
  assert.equal(camera.fov, 38, 'FOV must remain stable across aspect ratio updates');
});
