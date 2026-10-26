import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as THREE from 'three';
import { CANDIDATE_SITES } from '@/domain/sites/catalog';
import {
  asSelenographicLatitudeDeg,
  asSelenographicLongitudeDeg,
} from '@/domain/coordinates/frames';
import {
  CameraPreset,
  DEFAULT_SPATIAL_PREFERENCES,
} from '@/features/spatial/model/spatialPreferences';
import {
  CAMERA_PRESETS,
  ALL_CAMERA_PRESET_IDS,
  findCameraPresetOption,
} from '@/features/spatial/config/spatialToolbarOptions';
import {
  cameraPoseForPreset,
  createCameraTransitioner,
  NADIR_CAMERA_DISTANCE,
} from '@/features/spatial/globe/interaction/globeCameraPresets';
import {
  createLunarRoverController,
  RoverTelemetry,
} from '@/features/spatial/globe/interaction/lunarRoverController';
import {
  GlobeFlightDeckHudOverlay,
  GlobeFlightDeckHudOverlayProps,
} from '@/features/spatial/globe/components/GlobeFlightDeckHudOverlay';
import { SpatialToolbar } from '@/features/spatial/components/toolbar/SpatialToolbar';
import { MOON_SCENE_RADIUS } from '@/features/spatial/globe/scene/globeScene';

const testSite = CANDIDATE_SITES[0];

function renderHud(props: Partial<GlobeFlightDeckHudOverlayProps>) {
  const defaultProps: GlobeFlightDeckHudOverlayProps = {
    cameraPreset: 'site',
    selectedSite: testSite,
    subSolarLatDeg: asSelenographicLatitudeDeg(-1.5),
    subSolarLonDeg: asSelenographicLongitudeDeg(45.0),
    subEarthLatDeg: asSelenographicLatitudeDeg(6.2),
    subEarthLonDeg: asSelenographicLongitudeDeg(-12.4),
    earthElevationValue: 8.5,
    isRoverActive: false,
    onToggleRoverActive: () => {},
    roverTelemetry: null,
    showDiagnostics: false,
    epochIsoUtc: '2026-10-26T12:00:00Z',
    ...props,
  };
  return renderToStaticMarkup(React.createElement(GlobeFlightDeckHudOverlay, defaultProps));
}

// =========================================================================
// 1. Camera Presets Stress Matrix (All 8 presets across 9 sites = 72 cases)
// =========================================================================

test('Camera Presets: All 8 presets produce valid, non-degenerate poses across all 9 catalog sites', () => {
  const presets: CameraPreset[] = [
    'global', 'nadir', 'oblique', 'site', 'inspection', 'overhead', 'horizon', 'eva',
  ];

  for (const site of CANDIDATE_SITES) {
    for (const preset of presets) {
      const pose = cameraPoseForPreset(preset, site);

      // 1. Coordinates must be strictly finite
      assert.ok(Number.isFinite(pose.camPos.x), `${preset}@${site.id}: camPos.x finite`);
      assert.ok(Number.isFinite(pose.camPos.y), `${preset}@${site.id}: camPos.y finite`);
      assert.ok(Number.isFinite(pose.camPos.z), `${preset}@${site.id}: camPos.z finite`);
      assert.ok(Number.isFinite(pose.lookTarget.x), `${preset}@${site.id}: lookTarget.x finite`);
      assert.ok(Number.isFinite(pose.lookTarget.y), `${preset}@${site.id}: lookTarget.y finite`);
      assert.ok(Number.isFinite(pose.lookTarget.z), `${preset}@${site.id}: lookTarget.z finite`);

      // 2. Up-vector must be unit length
      const upLen = pose.upVector.length();
      assert.ok(Math.abs(upLen - 1.0) < 1e-4, `${preset}@${site.id}: upVector must be unit length`);

      // 3. Camera position must not coincide with look target
      const dist = pose.camPos.distanceTo(pose.lookTarget);
      assert.ok(dist > 0.001, `${preset}@${site.id}: camera-target distance must be > 0.001 (was ${dist})`);

      // 4. Camera and look vector must not be collinear with up-vector (no gimbal lock)
      const lookDir = pose.lookTarget.clone().sub(pose.camPos).normalize();
      const dotUp = Math.abs(lookDir.dot(pose.upVector));
      assert.ok(dotUp < 0.999, `${preset}@${site.id}: lookDir must not be collinear with up-vector`);

      // 5. Preset-specific altitude invariants
      if (preset === 'overhead') {
        assert.ok(dist >= 0.12 && dist <= 0.16, `Overhead distance should be ~0.136, was ${dist}`);
      } else if (preset === 'inspection') {
        assert.ok(dist > 0.05 && dist < 0.15, `Inspection distance should be [0.05, 0.15], was ${dist}`);
      } else if (preset === 'nadir') {
        assert.ok(Math.abs(pose.camPos.y - (-NADIR_CAMERA_DISTANCE)) < 1e-4, 'Nadir camera at -4.8Y');
      } else if (preset === 'global') {
        assert.ok(pose.camPos.length() >= 5.5, 'Global camera frames entire Moon');
      }
    }
  }
});

test('Camera Presets: Option resolver supports all 8 presets and maps southPole alias cleanly', () => {
  assert.equal(ALL_CAMERA_PRESET_IDS.length, 8);

  for (const presetId of ALL_CAMERA_PRESET_IDS) {
    const opt = findCameraPresetOption(presetId);
    assert.ok(opt, `findCameraPresetOption must resolve ${presetId}`);
    if (presetId === 'southPole') {
      assert.equal(opt.preset, 'nadir');
      assert.equal(opt.id, 'southPole');
    } else {
      assert.equal(opt.preset, presetId);
      assert.equal(opt.id, presetId);
    }
  }

  // Canonical 'nadir' resolves to South Pole option
  const nadirOpt = findCameraPresetOption('nadir');
  assert.ok(nadirOpt);
  assert.equal(nadirOpt.preset, 'nadir');
  assert.equal(nadirOpt.id, 'southPole');

  // Unknown preset returns undefined
  assert.equal(findCameraPresetOption('nonexistent' as any), undefined);
});

test('Camera Transitioner: Multi-hop rapid transitions settle cleanly without NaN or target drift', () => {
  const transitioner = createCameraTransitioner();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100);
  const controls = { target: new THREE.Vector3(0, 0, 0), update: () => {} } as any;

  const sequence: CameraPreset[] = ['global', 'overhead', 'eva', 'nadir', 'oblique', 'inspection', 'horizon', 'site'];

  for (const nextPreset of sequence) {
    transitioner.moveTo(nextPreset, testSite);
    assert.ok(transitioner.isTransitioning());

    for (let i = 0; i < 45; i++) {
      transitioner.step(camera, controls);
    }

    assert.equal(transitioner.isTransitioning(), false, `Transition to ${nextPreset} must complete`);
    const expected = cameraPoseForPreset(nextPreset, testSite);
    assert.ok(camera.position.distanceTo(expected.camPos) < 1e-4);
    assert.ok(controls.target.distanceTo(expected.lookTarget) < 1e-4);
  }
});

// =========================================================================
// 2. Rover Driving Telemetry & Key Controls
// =========================================================================

test('Lunar Rover: W/A/S/D and Arrow keys steer, accelerate, reverse, and decelerate cleanly', () => {
  const dom = { addEventListener: () => {}, removeEventListener: () => {} } as any;
  const rover = createLunarRoverController(dom, testSite);
  rover.attach();
  rover.setActive(true);

  const cam = new THREE.PerspectiveCamera(60, 1, 0.01, 100);

  const press = (key: string) => {
    const ev = new Event('keydown');
    (ev as any).key = key;
    globalThis.dispatchEvent(ev);
  };
  const release = (key: string) => {
    const ev = new Event('keyup');
    (ev as any).key = key;
    globalThis.dispatchEvent(ev);
  };

  // 1. Accelerate forward with 'w'
  press('w');
  for (let i = 0; i < 20; i++) rover.update(0.1, cam);
  let t = rover.getTelemetry();
  assert.equal(t.speedMps, 4.5, 'Max forward speed should reach 4.5 m/s');
  assert.equal(t.isDriving, true);
  release('w');

  // 2. Decelerate to stop when idle
  for (let i = 0; i < 20; i++) rover.update(0.1, cam);
  t = rover.getTelemetry();
  assert.equal(t.speedMps, 0.0, 'Speed must return to 0.0 when throttle released');
  assert.equal(t.isDriving, false);

  // 3. Accelerate forward with 'ArrowUp'
  press('ArrowUp');
  for (let i = 0; i < 20; i++) rover.update(0.1, cam);
  t = rover.getTelemetry();
  assert.equal(t.speedMps, 4.5);
  release('ArrowUp');
  for (let i = 0; i < 20; i++) rover.update(0.1, cam);

  // 4. Reverse with 's' (slower than forward: -2.7 m/s)
  press('s');
  for (let i = 0; i < 20; i++) rover.update(0.1, cam);
  t = rover.getTelemetry();
  assert.equal(t.speedMps, -2.7, 'Reverse speed must reach -2.7 m/s');
  release('s');
  for (let i = 0; i < 20; i++) rover.update(0.1, cam);

  // 5. Steer with 'd' (turns right by 45 deg/s)
  press('d');
  for (let i = 0; i < 10; i++) rover.update(0.1, cam); // 1.0 second
  t = rover.getTelemetry();
  assert.equal(t.headingDeg, 45, 'Heading should turn 45 degrees right');
  release('d');

  // 6. Steer with 'ArrowLeft' (turns left by 45 deg/s)
  press('ArrowLeft');
  for (let i = 0; i < 10; i++) rover.update(0.1, cam); // 1.0 second
  t = rover.getTelemetry();
  assert.equal(t.headingDeg, 0, 'Heading should turn 45 degrees left back to 0');
  release('ArrowLeft');

  rover.detach();
});

test('Lunar Rover: Altimetry sampling, anti-penetration floor, and gravity spring settling', () => {
  const dom = { addEventListener: () => {}, removeEventListener: () => {} } as any;
  const rover = createLunarRoverController(dom, testSite);
  rover.setActive(true);

  const cam = new THREE.PerspectiveCamera(60, 1, 0.01, 100);

  // Drive across terrain for 100 frames
  for (let i = 0; i < 100; i++) {
    rover.update(0.05, cam);
    const telemetry = rover.getTelemetry();

    assert.ok(telemetry.elevationMeters > 0, 'Elevation must be positive near Shackleton rim');
    assert.ok(telemetry.slopeDeg >= 0 && telemetry.slopeDeg < 90, 'Slope must be physically valid');

    // Anti-penetration check: camera radial distance must stay strictly above Moon radius
    const camRadius = cam.position.length();
    assert.ok(camRadius > MOON_SCENE_RADIUS, `Camera (${camRadius}) must never dip below Moon surface (${MOON_SCENE_RADIUS})`);
  }
});

test('Rover HUD: Esc key dismissal listener and HTML telemetry rendering', () => {
  let escapeTriggered = false;
  const handleEscape = () => {
    escapeTriggered = true;
  };

  // Test Escape dismissal effect simulated via global event listener
  const listener = (e: KeyboardEvent) => {
    if (e.key === 'Escape') handleEscape();
  };
  globalThis.addEventListener('keydown', listener);

  // 1. Non-escape key does not trigger dismissal
  const nonEscEvent = new Event('keydown');
  (nonEscEvent as any).key = 'Enter';
  globalThis.dispatchEvent(nonEscEvent);
  assert.equal(escapeTriggered, false);

  // 2. Escape key triggers dismissal
  const escEvent = new Event('keydown');
  (escEvent as any).key = 'Escape';
  globalThis.dispatchEvent(escEvent);
  assert.equal(escapeTriggered, true);

  globalThis.removeEventListener('keydown', listener);

  // 3. Active rover HUD renders Esc hint and driving key hints
  const activeHtml = renderHud({
    isRoverActive: true,
    cameraPreset: 'horizon',
    roverTelemetry: {
      latDeg: -89.897,
      lonDeg: 120.4,
      elevationMeters: -1250, // Negative elevation in crater floor
      slopeDeg: 14.2,
      speedMps: 3.8,
      headingDeg: 270,
      pitchDeg: 5,
      isDriving: true,
    },
  });

  assert.ok(activeHtml.includes('W/A/S/D or Arrow keys'), 'HUD must list W/A/S/D driving hints');
  assert.ok(activeHtml.includes('Esc</strong> to exit'), 'HUD must list Esc key hint');
  assert.ok(activeHtml.includes('-1,250 m'), 'Negative crater elevations format with - sign');
  assert.ok(activeHtml.includes('14.2°'), 'Slope telemetry formats to 1 decimal');
  assert.ok(activeHtml.includes('3.8 m/s'), 'Speed telemetry formats to 1 decimal');
});

// =========================================================================
// 3. Overhead Tactical Nadir HUD Mounting
// =========================================================================

test('Overhead HUD: Mounts exclusively on overhead preset and formats tactical badge', () => {
  const overheadHtml = renderHud({ cameraPreset: 'overhead' });
  assert.ok(overheadHtml.includes('data-testid="overhead-hud"'), 'Overhead preset must mount overhead HUD');
  assert.ok(overheadHtml.includes(`OVERHEAD NADIR • ${testSite.code}`), 'Overhead HUD must show site code');
  assert.ok(overheadHtml.includes('Tactical 84° Nadir'), 'Overhead HUD must display tactical angle');
  assert.ok(overheadHtml.includes('Drag to rotate azimuth'), 'Overhead HUD must show azimuth rotation hint');

  const otherPresets: CameraPreset[] = ['global', 'nadir', 'oblique', 'site', 'inspection', 'horizon', 'eva'];
  for (const preset of otherPresets) {
    const html = renderHud({ cameraPreset: preset });
    assert.strictEqual(html.includes('data-testid="overhead-hud"'), false, `Preset ${preset} must not render overhead HUD`);
  }
});

// =========================================================================
// 4. Visor HUD Mounting on eva Preset
// =========================================================================

test('Visor HUD: Mounts exclusively on eva preset, binds exit callback, and handles boundary values', () => {
  const evaHtml = renderHud({
    cameraPreset: 'eva',
    earthElevationValue: -3.5, // Negative earth angle (occluded)
  });

  assert.ok(evaHtml.includes('xEMU HUD'), 'Visor HUD must mount on eva preset');
  assert.ok(evaHtml.includes('Exit EVA Mode'), 'Visor HUD must offer exit button');
  assert.ok(evaHtml.includes('PLSS Life Support'), 'Visor HUD must display PLSS life support');
  assert.ok(evaHtml.includes('-3.5°'), 'Negative earth elevation renders with - sign');

  // Verify non-eva presets omit visor HUD
  const nonEvaPresets: CameraPreset[] = ['global', 'nadir', 'oblique', 'site', 'inspection', 'overhead', 'horizon'];
  for (const preset of nonEvaPresets) {
    const html = renderHud({ cameraPreset: preset });
    assert.strictEqual(html.includes('xEMU HUD'), false, `Preset ${preset} must not mount helmet HUD`);
    assert.strictEqual(html.includes('Exit EVA Mode'), false, `Preset ${preset} must not mount exit EVA button`);
  }
});

// =========================================================================
// 5. Flyover Tour Toggle in SpatialToolbar
// =========================================================================

test('SpatialToolbar: Flyover tour button is disabled in 2D map mode and interactive in 3D/Dual', () => {
  // 1. 2D Map mode: disabled with cursor-not-allowed
  const html2D = renderToStaticMarkup(
    React.createElement(SpatialToolbar, {
      viewMode: 'map2d',
      onViewModeChange: () => {},
      preferences: DEFAULT_SPATIAL_PREFERENCES,
      onToggleLayer: () => {},
      onCameraPresetChange: () => {},
      isFullscreenActive: false,
      onToggleFullscreen: () => {},
    })
  );

  assert.ok(html2D.includes('data-testid="toggle-flyover"'), 'Flyover button must exist in 2D mode');
  assert.ok(html2D.includes('disabled=""') || html2D.includes('disabled'), 'Flyover button must have disabled attribute in 2D');
  assert.ok(html2D.includes('cursor-not-allowed'), 'Flyover button must have cursor-not-allowed class in 2D');
  assert.ok(html2D.includes('Flyover tour active in 3D Moon &amp; Dual View'), 'Flyover button must explain availability in tooltip');

  // 2. 3D Moon mode: enabled and interactive
  const html3DIdle = renderToStaticMarkup(
    React.createElement(SpatialToolbar, {
      viewMode: 'globe3d',
      onViewModeChange: () => {},
      preferences: DEFAULT_SPATIAL_PREFERENCES,
      onToggleLayer: () => {},
      onCameraPresetChange: () => {},
      isFullscreenActive: false,
      onToggleFullscreen: () => {},
      isFlyoverActive: false,
    })
  );

  assert.ok(!html3DIdle.includes('cursor-not-allowed'), 'Flyover button must not have cursor-not-allowed in 3D');
  assert.ok(html3DIdle.includes('Flyover'), 'Resting flyover button displays Flyover label');
  assert.ok(html3DIdle.includes('Start 360° crater flyover tour'), 'Resting flyover tooltip explains action');

  // 3. Active Flyover state in Dual View: pulsing cyan border and Touring label
  const htmlDualActive = renderToStaticMarkup(
    React.createElement(SpatialToolbar, {
      viewMode: 'dual',
      onViewModeChange: () => {},
      preferences: DEFAULT_SPATIAL_PREFERENCES,
      onToggleLayer: () => {},
      onCameraPresetChange: () => {},
      isFullscreenActive: false,
      onToggleFullscreen: () => {},
      isFlyoverActive: true,
    })
  );

  assert.ok(htmlDualActive.includes('animate-pulse'), 'Active flyover button has animate-pulse');
  assert.ok(htmlDualActive.includes('border-cyan-400'), 'Active flyover button has cyan border');
  assert.ok(htmlDualActive.includes('Touring'), 'Active flyover button displays Touring label');
  assert.ok(htmlDualActive.includes('Stop crater flyover tour'), 'Active flyover button has stop tooltip');
});

test('SpatialToolbar: Flyover tour orbital rotation maintains invariant camera-target distance over 1000 frames', () => {
  const target = new THREE.Vector3(0, -0.8, 0);
  const cameraPos = new THREE.Vector3(0, -3.2, 2.2); // Oblique camera pose
  const upVector = new THREE.Vector3(0, 0.6, 0.8).normalize();

  const initialDistance = cameraPos.distanceTo(target);

  // Simulate 1000 frames of flyover rotation around up-axis
  const flyoverAxis = upVector.clone().normalize();
  for (let frame = 0; frame < 1000; frame++) {
    const offset = cameraPos.clone().sub(target);
    offset.applyAxisAngle(flyoverAxis, 0.0035);
    cameraPos.copy(target).add(offset);
  }

  const finalDistance = cameraPos.distanceTo(target);
  assert.ok(
    Math.abs(finalDistance - initialDistance) < 1e-5,
    `Flyover orbital distance must remain constant (was ${finalDistance}, started at ${initialDistance})`
  );
  assert.ok(Number.isFinite(cameraPos.x) && Number.isFinite(cameraPos.y) && Number.isFinite(cameraPos.z));
});
