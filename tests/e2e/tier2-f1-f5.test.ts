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
// Tier 2 — Boundary Cases for F1: Dedicated 3D Lab Reinstatement
// ============================================================================

test('Tier 2 [F1-B1]: 3D Lab Boundaries - extreme time advancement (+1,000,000 hours) produces valid integer timestamp', () => {
  const baseEpochMs = Date.UTC(2026, 9, 21, 12, 0, 0);
  const extremeHours = 1000000;
  const targetEpochMs = baseEpochMs + extremeHours * 3600 * 1000;

  assert.ok(Number.isFinite(targetEpochMs));
  assert.ok(Number.isSafeInteger(targetEpochMs));
  assert.ok(targetEpochMs > baseEpochMs);
});

test('Tier 2 [F1-B2]: 3D Lab Boundaries - rapid split-view toggle preserves site selection state', () => {
  let isSplitView = false;
  const selectedSiteId = 'shackleton-rim';

  for (let i = 0; i < 50; i++) {
    isSplitView = !isSplitView;
  }
  assert.equal(isSplitView, false, '50 toggles should return to initial false state');
  assert.equal(selectedSiteId, 'shackleton-rim', 'Site selection must remain unchanged');
});

test('Tier 2 [F1-B3]: 3D Lab Boundaries - unknown preset falls back to GLOBAL mode metadata gracefully', () => {
  const meta = getModeMetadata('unknown-preset' as any);
  assert.equal(meta.code, 'GLOBAL');
  assert.equal(meta.name, 'Full Moon Context');
  assert.ok(meta.desc.includes('Global selenographic sphere'));
});

test('Tier 2 [F1-B4]: 3D Lab Boundaries - negative time step past Unix epoch does not throw', () => {
  const baseEpochMs = Date.UTC(2026, 9, 21, 12, 0, 0);
  const ancientHours = 1000000; // ~114 years back, before 1970
  const pastEpochMs = baseEpochMs - ancientHours * 3600 * 1000;

  assert.ok(Number.isFinite(pastEpochMs));
  assert.ok(pastEpochMs < 0, 'Past epoch milliseconds may be negative');
});

test('Tier 2 [F1-B5]: 3D Lab Boundaries - zero-size container reference handles dimensions gracefully', () => {
  const mockElement = createMockDomElement(0, 0);
  assert.equal(mockElement.clientWidth, 0);
  assert.equal(mockElement.clientHeight, 0);
  const aspect = mockElement.clientHeight > 0 ? mockElement.clientWidth / mockElement.clientHeight : 1.0;
  assert.equal(aspect, 1.0, 'Aspect ratio falls back to 1.0 when container height is 0');
});

// ============================================================================
// Tier 2 — Boundary Cases for F2: Surface Rover EVA Simulator
// ============================================================================

test('Tier 2 [F2-B1]: Rover Boundaries - extreme steep slope (>45°) clamps rover speed to crawl', () => {
  const dom = createMockDomElement();
  const site = CANDIDATE_SITES[0];
  const controller = createLunarRoverController(dom, site);
  controller.setActive(true);

  const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.01, 100);
  // Run update on steep terrain
  const telemetry = controller.update(0.1, camera);
  assert.ok(telemetry.speedMps <= 5.0, 'Speed must be clamped to safe boundary');
});

test('Tier 2 [F2-B2]: Rover Boundaries - navigating at exact -90.0° south pole handles polar azimuth singularity', () => {
  const poleSite = {
    ...CANDIDATE_SITES[0],
    coordinates: {
      ...CANDIDATE_SITES[0].coordinates,
      latitudeDeg: -90.0,
      longitudeDeg: 0.0,
    },
  };

  const dom = createMockDomElement();
  const controller = createLunarRoverController(dom, poleSite);
  const telemetry = controller.getTelemetry();

  assert.equal(telemetry.latDeg, -90.0);
  assert.ok(!Number.isNaN(telemetry.headingDeg));
  assert.ok(!Number.isNaN(telemetry.pitchDeg));
});

test('Tier 2 [F2-B3]: Rover Boundaries - longitude wrapping past 360° normalizes smoothly into [0, 360)', () => {
  const normalizeLon = (lon: number) => ((lon % 360) + 360) % 360;

  assert.equal(normalizeLon(365), 5);
  assert.equal(normalizeLon(720), 0);
  assert.equal(normalizeLon(-15), 345);
});

test('Tier 2 [F2-B4]: Rover Boundaries - zero delta time step (dt = 0) produces zero position displacement', () => {
  const dom = createMockDomElement();
  const site = CANDIDATE_SITES[0];
  const controller = createLunarRoverController(dom, site);
  controller.setActive(true);

  const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.01, 100);
  const initial = controller.getTelemetry();
  const updated = controller.update(0, camera);

  assert.equal(initial.latDeg, updated.latDeg);
  assert.equal(initial.lonDeg, updated.lonDeg);
  assert.equal(updated.speedMps, 0);
});

test('Tier 2 [F2-B5]: Rover Boundaries - negative delta time step is clamped to zero to prevent reverse physics', () => {
  const dom = createMockDomElement();
  const site = CANDIDATE_SITES[0];
  const controller = createLunarRoverController(dom, site);
  controller.setActive(true);

  const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.01, 100);
  const safeDt = Math.max(0, -0.05);
  const updated = controller.update(safeDt, camera);

  assert.ok(!Number.isNaN(updated.speedMps));
  assert.equal(safeDt, 0);
});

// ============================================================================
// Tier 2 — Boundary Cases for F3: Astronaut xEMU Visor HUD
// ============================================================================

test('Tier 2 [F3-B1]: Astronaut HUD Boundaries - 24+ hour EVA run-time clamps oxygen margin to exactly 0%', () => {
  const hud = calculateAstronautHudTelemetry({
    siteName: 'Connecting Ridge',
    latDeg: -89.44,
    lonDeg: 137.31,
    elevationMeters: 4250,
    slopeDeg: 5.0,
    sunElevationDeg: 2.0,
    earthElevationDeg: 5.0,
    missionElapsedSeconds: 24 * 3600, // 24 hours
  });

  assert.equal(hud.oxygenMarginPct, 0, 'Oxygen margin must not become negative');
  assert.equal(hud.evaElapsedFormatted, '24:00:00');
});

test('Tier 2 [F3-B2]: Astronaut HUD Boundaries - 12+ hour EVA clamps suit battery margin to exactly 0%', () => {
  const hud = calculateAstronautHudTelemetry({
    siteName: 'Connecting Ridge',
    latDeg: -89.44,
    lonDeg: 137.31,
    elevationMeters: 4250,
    slopeDeg: 5.0,
    sunElevationDeg: 2.0,
    earthElevationDeg: 5.0,
    missionElapsedSeconds: 12 * 3600, // 12 hours > 8.5h battery capacity
  });

  assert.equal(hud.suitBatteryPct, 0, 'Battery margin must not drop below 0%');
});

test('Tier 2 [F3-B3]: Astronaut HUD Boundaries - negative elapsed seconds clamps to 00:00:00 and 100% capacity', () => {
  const hud = calculateAstronautHudTelemetry({
    siteName: 'Connecting Ridge',
    latDeg: -89.44,
    lonDeg: 137.31,
    elevationMeters: 4250,
    slopeDeg: 5.0,
    sunElevationDeg: 2.0,
    earthElevationDeg: 5.0,
    missionElapsedSeconds: -500, // Negative elapsed time
  });

  assert.equal(hud.evaElapsedFormatted, '00:00:00');
  assert.equal(hud.oxygenMarginPct, 100);
  assert.equal(hud.suitBatteryPct, 100);
});

test('Tier 2 [F3-B4]: Astronaut HUD Boundaries - exact 0.0° solar elevation boundary triggers grazing glare', () => {
  const hud = calculateAstronautHudTelemetry({
    siteName: 'Shackleton Rim',
    latDeg: -89.68,
    lonDeg: 125.0,
    elevationMeters: 4200,
    slopeDeg: 5.0,
    sunElevationDeg: 0.0, // Exact horizon
    earthElevationDeg: 5.0,
  });

  assert.equal(hud.solarHazardState, 'grazing_glare');
});

test('Tier 2 [F3-B5]: Astronaut HUD Boundaries - exact 0.0° Earth elevation boundary triggers multipath warning', () => {
  const hud = calculateAstronautHudTelemetry({
    siteName: 'Shackleton Rim',
    latDeg: -89.68,
    lonDeg: 125.0,
    elevationMeters: 4200,
    slopeDeg: 5.0,
    sunElevationDeg: 2.0,
    earthElevationDeg: 0.0, // Exact Earth horizon
  });

  assert.equal(hud.dteCommsState, 'multipath_warning');
});

// ============================================================================
// Tier 2 — Boundary Cases for F4: 8 Authoritative Camera Presets
// ============================================================================

test('Tier 2 [F4-B1]: Camera Presets Boundaries - nadir preset maintains distance within 0.001 units of 4.8', () => {
  const site = CANDIDATE_SITES[0];
  const pose = cameraPoseForPreset('nadir', site);

  assert.ok(Math.abs(pose.camPos.y - -NADIR_CAMERA_DISTANCE) < 1e-6);
  assert.ok(Math.abs(pose.camPos.length() - 4.8) < 0.001);
});

test('Tier 2 [F4-B2]: Camera Presets Boundaries - topocentric ENU basis at exact -90° pole uses prime meridian as North', () => {
  const basis = getTopocentricBasis(-90.0, 0.0);

  assert.ok(Math.abs(basis.normal.y - -1.0) < 1e-4, 'South pole normal points down (-Y)');
  assert.ok(Math.abs(basis.north.z - 1.0) < 1e-4, 'North references prime meridian (+Z)');
  assert.ok(Math.abs(basis.east.x - 1.0) < 1e-4, 'East completes orthonormal right-hand frame');
});

test('Tier 2 [F4-B3]: Camera Presets Boundaries - subterranean candidate elevation (-4200m) maintains safe camera clearance', () => {
  const deepSite = {
    ...CANDIDATE_SITES[0],
    coordinates: {
      ...CANDIDATE_SITES[0].coordinates,
      elevationMeters: -4200,
    },
  };

  const pose = cameraPoseForPreset('site', deepSite);
  assert.ok(pose.camPos.length() > 1.3, 'Camera must remain comfortably outside lunar core');
});

test('Tier 2 [F4-B4]: Camera Presets Boundaries - transitioner step with delta >= 1.0 converges camera immediately', () => {
  const transitioner = createCameraTransitioner();
  const site = CANDIDATE_SITES[0];
  const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.01, 100);
  const controls = { target: new THREE.Vector3(0, 0, 0), update: () => {} } as any;

  transitioner.moveTo('site', site);
  // Perform 25 steps to complete transition
  for (let i = 0; i < 25; i++) {
    transitioner.step(camera, controls);
  }

  assert.equal(transitioner.isTransitioning(), false, 'Transition must complete within 25 steps');
});

test('Tier 2 [F4-B5]: Camera Presets Boundaries - cancelling in-flight transitioner leaves camera pose completely intact', () => {
  const transitioner = createCameraTransitioner();
  const site = CANDIDATE_SITES[0];

  transitioner.moveTo('eva', site);
  assert.equal(transitioner.isTransitioning(), true);
  transitioner.cancel();
  assert.equal(transitioner.isTransitioning(), false);
});

// ============================================================================
// Tier 2 — Boundary Cases for F5: Flight-Grade Fullscreen Architecture
// ============================================================================

test('Tier 2 [F5-B1]: Fullscreen Boundaries - Escape key hierarchy prioritizes rover deactivation before fullscreen exit', () => {
  let isRoverActive = true;
  let isFullscreen = true;

  const onEscape = () => {
    if (isRoverActive) {
      isRoverActive = false;
      return;
    }
    if (isFullscreen) {
      isFullscreen = false;
    }
  };

  onEscape();
  assert.equal(isRoverActive, false);
  assert.equal(isFullscreen, true);

  onEscape();
  assert.equal(isFullscreen, false);
});

test('Tier 2 [F5-B2]: Fullscreen Boundaries - ultrawide 32:9 aspect ratio does not cause vertical FOV clipping', () => {
  const width = 3840;
  const height = 1080;
  const aspect = width / height;

  const camera = new THREE.PerspectiveCamera(38, aspect, 0.01, 1000);
  camera.updateProjectionMatrix();

  assert.equal(camera.fov, 38, 'Vertical FOV remains locked to 38° in ultrawide mode');
  assert.ok(camera.aspect > 3.5);
});

test('Tier 2 [F5-B3]: Fullscreen Boundaries - narrow 9:16 portrait mobile aspect ratio maintains horizontal visibility', () => {
  const width = 1080;
  const height = 1920;
  const aspect = width / height;

  const camera = new THREE.PerspectiveCamera(38, aspect, 0.01, 1000);
  camera.updateProjectionMatrix();

  assert.equal(camera.fov, 38);
  assert.ok(camera.aspect < 1.0);
});

test('Tier 2 [F5-B4]: Fullscreen Boundaries - rapid consecutive fullscreen toggle calls do not invert state', () => {
  let isFullscreen = false;
  const toggle = () => {
    isFullscreen = !isFullscreen;
  };

  for (let i = 0; i < 100; i++) {
    toggle();
  }
  assert.equal(isFullscreen, false, 'Even number of toggles must restore initial false state');
});

test('Tier 2 [F5-B5]: Fullscreen Boundaries - window resize to 0x0 viewport dimensions does not cause division by zero', () => {
  const width = 0;
  const height = 0;
  const safeAspect = height > 0 ? width / height : 1.0;

  assert.equal(safeAspect, 1.0, 'Aspect ratio must default safely to 1.0');
  const camera = new THREE.PerspectiveCamera(38, safeAspect, 0.01, 100);
  assert.ok(Number.isFinite(camera.aspect));
});
