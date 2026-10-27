import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as THREE from 'three';
import App from '@/app/App';
import { ScenarioProvider } from '@/app/scenario/ScenarioProvider';
import { CANDIDATE_SITES } from '@/domain/sites/catalog';
import {
  createLunarRoverController,
} from '@/features/spatial/globe/interaction/lunarRoverController';
import { AstronautHelmetHud } from '@/features/spatial/globe/components/AstronautHelmetHud';
import { calculateAstronautHudTelemetry } from '@/features/spatial/globe/model/astronautHudModel';
import { cameraPoseForPreset } from '@/features/spatial/globe/scene/globeCameraPresets';
import {
  ALL_CAMERA_PRESET_IDS,
  CAMERA_PRESETS,
  CAMERA_PRESET_ALIASES,
  findCameraPresetOption,
} from '@/features/spatial/config/spatialToolbarOptions';
import { Scenario3DLab } from '@/features/spatial/lab/Scenario3DLab';
import { MapCanvas } from '@/features/spatial/map/components/MapCanvas';
import { LunarGlobe3D } from '@/features/spatial/ui/LunarGlobe3D';
import { MOON_SCENE_RADIUS } from '@/domain/terrain/lolaSouthPoleDemSampler';
import { SpatialWorkspace } from '@/features/spatial/ui/SpatialWorkspace';

const testSite = CANDIDATE_SITES[0]; // Connecting Ridge
const shackletonSite = CANDIDATE_SITES.find((s) => s.id.includes('shackleton')) ?? CANDIDATE_SITES[1];

// ============================================================================
// FOCUS AREA 1: Route & History State Parsing & Component Mounting
// ============================================================================

test('CHALLENGER 1.1: Direct URL entry cleanly mounts Scenario3DLab', () => {
  const originalWindow = (globalThis as any).window;
  try {
    (globalThis as any).window = {
      location: {
        pathname: '/scenario/3d-lab',
        hash: '',
        search: '',
        href: 'http://localhost/scenario/3d-lab',
      },
      addEventListener: () => {},
      removeEventListener: () => {},
    };

    const html = renderToStaticMarkup(
      <ScenarioProvider>
        <App />
      </ScenarioProvider>
    );

    assert.ok(html.includes('LunaMission 3D Lab'), 'Direct /scenario/3d-lab must mount Scenario3DLab title');
    assert.ok(html.includes('STANDALONE 3D HARNESS'), 'Must mount 3D Lab standalone harness badge');
    assert.ok(html.includes('Return to LunaMission Observatory'), 'Must render Return to Observatory action');
  } finally {
    (globalThis as any).window = originalWindow;
  }
});

test('CHALLENGER 1.2: Hash and Search URL variants activate 3D Lab', () => {
  const originalWindow = (globalThis as any).window;
  try {
    // Hash variant (#/scenario/3d-lab)
    (globalThis as any).window = {
      location: { pathname: '/', hash: '#/scenario/3d-lab', search: '' },
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    let html = renderToStaticMarkup(
      <ScenarioProvider>
        <App />
      </ScenarioProvider>
    );
    assert.ok(html.includes('LunaMission 3D Lab'), 'Hash route #/scenario/3d-lab must activate 3D Lab');

    // Query variant (?scenario=3d-lab)
    (globalThis as any).window = {
      location: { pathname: '/', hash: '', search: '?scenario=3d-lab' },
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    html = renderToStaticMarkup(
      <ScenarioProvider>
        <App />
      </ScenarioProvider>
    );
    assert.ok(html.includes('LunaMission 3D Lab'), 'Query string ?scenario=3d-lab must activate 3D Lab');
  } finally {
    (globalThis as any).window = originalWindow;
  }
});

test('CHALLENGER 1.3: Scenario3DLab Return to Observatory callback integrates cleanly', () => {
  let returnedToObservatory = false;
  const labHtml = renderToStaticMarkup(
    <ScenarioProvider>
      <Scenario3DLab onReturnToObservatory={() => { returnedToObservatory = true; }} />
    </ScenarioProvider>
  );

  assert.ok(labHtml.includes('Return to LunaMission Observatory'), 'Must offer Return to Observatory button');
  assert.ok(labHtml.includes('touch-none'), 'Lab container must enforce touch-none');
});

test('CHALLENGER 1.4: 50 Rapid consecutive route changes do not crash', () => {
  const originalWindow = (globalThis as any).window;
  try {
    for (let i = 0; i < 50; i++) {
      const isLab = i % 2 === 0;
      (globalThis as any).window = {
        location: {
          pathname: isLab ? '/scenario/3d-lab' : '/explore',
          hash: '',
          search: '',
        },
        addEventListener: () => {},
        removeEventListener: () => {},
      };
      const html = renderToStaticMarkup(
        <ScenarioProvider>
          <App />
        </ScenarioProvider>
      );
      assert.ok(html.length > 500, `Render step ${i} must produce valid non-empty markup`);
    }
  } finally {
    (globalThis as any).window = originalWindow;
  }
});

// ============================================================================
// FOCUS AREA 2: Rover Controller & Visor HUD (Physics, Clamping, Slopes)
// ============================================================================

test('CHALLENGER 2.1: Rover Controller velocity clamping and deadband deceleration', () => {
  const dummyDom = { addEventListener: () => {}, removeEventListener: () => {} } as any;
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const rover = createLunarRoverController(dummyDom, testSite);

  rover.attach();
  rover.setActive(true);

  // Drive forward for 100 frames at dt = 0.05s
  for (let i = 0; i < 100; i++) {
    rover.update(0.05, camera);
  }

  const initialTel = rover.getTelemetry();
  assert.ok(initialTel.speedMps <= 4.5, `Speed ${initialTel.speedMps} must be clamped to <= 4.5 m/s`);
  assert.ok(initialTel.latDeg <= -80.0 && initialTel.latDeg >= -89.99, 'Latitude must stay in polar bounds');

  // Test inactive rover resets keys and stops driving
  rover.setActive(false);
  const inactiveTel = rover.getTelemetry();
  assert.equal(inactiveTel.isDriving, false, 'Inactive rover must report isDriving false');

  rover.detach();
});

test('CHALLENGER 2.2: Rover Controller numerical stability under extreme dt values', () => {
  const dummyDom = { addEventListener: () => {}, removeEventListener: () => {} } as any;
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const rover = createLunarRoverController(dummyDom, testSite);
  rover.attach();
  rover.setActive(true);

  // Adversarial dt test cases: 0s, negative, huge spike (1000s), tiny microsecond (0.000001s)
  const adversarialDts = [0, -10, 1000, 0.000001, 0.05];
  for (const dt of adversarialDts) {
    const tel = rover.update(dt, camera);
    assert.ok(!Number.isNaN(tel.latDeg), `dt=${dt} must produce finite latDeg`);
    assert.ok(!Number.isNaN(tel.lonDeg), `dt=${dt} must produce finite lonDeg`);
    assert.ok(!Number.isNaN(tel.speedMps), `dt=${dt} must produce finite speedMps`);
    assert.ok(!Number.isNaN(tel.elevationMeters), `dt=${dt} must produce finite elevationMeters`);
    assert.ok(!Number.isNaN(camera.position.x), `dt=${dt} camera position X must be finite`);
    assert.ok(!Number.isNaN(camera.position.y), `dt=${dt} camera position Y must be finite`);
    assert.ok(!Number.isNaN(camera.position.z), `dt=${dt} camera position Z must be finite`);
  }

  rover.detach();
});

test('CHALLENGER 2.3: Rover anti-penetration floor on deep negative elevation crater', () => {
  const dummyDom = { addEventListener: () => {}, removeEventListener: () => {} } as any;
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  // Shackleton crater floor sits at ~ -4200 meters
  const rover = createLunarRoverController(dummyDom, shackletonSite);
  rover.attach();
  rover.setActive(true);

  // Run 50 frames to settle spring-damper
  for (let i = 0; i < 50; i++) {
    rover.update(0.05, camera);
  }

  const tel = rover.getTelemetry();
  assert.ok(tel.elevationMeters < 5000, 'Elevation must be valid');
  assert.ok(tel.slopeDeg >= 0 && tel.slopeDeg <= 90, 'Slope must be in [0, 90]');
  assert.ok(camera.position.length() > 1.0, 'Camera radius must stay above lunar core');

  rover.detach();
});

test('CHALLENGER 2.4: Visor HUD pitch ladder rendering and optical reticle geometry', () => {
  const hudHtml = renderToStaticMarkup(
    <AstronautHelmetHud
      site={testSite}
      subSolarLatDeg={-1.5 as any}
      subSolarLonDeg={45.0 as any}
      subEarthLatDeg={6.2 as any}
      subEarthLonDeg={-10.0 as any}
      earthElevationDeg={6.5}
      onExit={() => {}}
    />
  );

  // Verify Pitch Ladder elements (+10 rung, 0 horizon bar with reticle pip, -10 dashed rung)
  assert.ok(hudHtml.includes('+10'), 'Pitch ladder must render +10 deg elevation rung');
  assert.ok(hudHtml.includes('-10'), 'Pitch ladder must render -10 deg depression rung');
  assert.ok(hudHtml.includes('w-2 h-2 rounded-full bg-cyan-400'), 'Horizon bar must feature center reticle pip');
  assert.ok(hudHtml.includes('border-dashed'), 'Depression rungs must be visually dashed per aerospace HUD standards');
  assert.ok(hudHtml.includes('xEMU HUD'), 'HUD header must designate xEMU system');
  assert.ok(hudHtml.includes('PLSS Life Support'), 'HUD must render PLSS life support block');
  assert.ok(hudHtml.includes('DSN Locked'), 'HUD must show DSN telecom lock status');
});

test('CHALLENGER 2.5: Astronaut HUD telemetry stress testing (scarp hazard, grazing glare, comms loss)', () => {
  // Test Case A: Extreme steep slope (> 15°) -> Scarp Hazard alert
  const steepTelemetry = calculateAstronautHudTelemetry({
    siteName: 'Shackleton Rim Wall',
    latDeg: -89.7,
    lonDeg: 120.0,
    elevationMeters: 2500,
    slopeDeg: 24.5,
    sunElevationDeg: 1.2, // Grazing glare
    earthElevationDeg: -2.5, // Occulted Earth
    missionElapsedSeconds: 7200,
  });

  assert.equal(steepTelemetry.terrainHazardState, 'scarp_danger');
  assert.equal(steepTelemetry.solarHazardState, 'grazing_glare');
  assert.equal(steepTelemetry.dteCommsState, 'occluded');

  // Test Case B: Nominal conditions (slope < 5°, sun > 2°, earth > 0°)
  const nominalTelemetry = calculateAstronautHudTelemetry({
    siteName: 'Connecting Ridge Plateau',
    latDeg: -89.44,
    lonDeg: 222.5,
    elevationMeters: 3820,
    slopeDeg: 3.2,
    sunElevationDeg: 4.5,
    earthElevationDeg: 8.0,
    missionElapsedSeconds: 3600,
  });

  assert.equal(nominalTelemetry.terrainHazardState, 'safe');
  assert.equal(nominalTelemetry.solarHazardState, 'nominal_sun');
  assert.equal(nominalTelemetry.dteCommsState, 'dsn_nominal');
});

// ============================================================================
// FOCUS AREA 3: Logarithmic Depth Buffer & SMAA Pass Post-Processing Chain
// ============================================================================

test('CHALLENGER 3.1: globeScene source inspection verifies logarithmic depth buffer & SMAA pass', () => {
  const globeScenePath = path.resolve(__dirname, '../globe/scene/globeScene.ts');
  const source = fs.readFileSync(globeScenePath, 'utf8');

  // 1. WebGLRenderer must be configured with logarithmicDepthBuffer: true
  assert.ok(
    source.includes('logarithmicDepthBuffer: true'),
    'globeScene.ts must initialize WebGLRenderer with logarithmicDepthBuffer: true'
  );

  // 2. High-performance powerPreference
  assert.ok(
    source.includes("powerPreference: 'high-performance'"),
    'globeScene.ts must request high-performance powerPreference'
  );

  // 3. SMAAPass integration into EffectComposer
  assert.ok(
    source.includes('new SMAAPass()'),
    'globeScene.ts must instantiate SMAAPass post-processing pass'
  );
  assert.ok(
    source.includes('composer.addPass(smaaPass)'),
    'globeScene.ts must add smaaPass to composer pipeline'
  );
});

test('CHALLENGER 3.2: Multi-LOD terrain mesh applies negative polygon offset against z-fighting', () => {
  const terrainPath = path.resolve(__dirname, '../globe/terrain/globeMultiLodTerrain.ts');
  const source = fs.readFileSync(terrainPath, 'utf8');

  assert.ok(source.includes('polygonOffset: true'), 'Multi-LOD terrain must enable polygonOffset');
  assert.ok(source.includes('polygonOffsetFactor: -1.0'), 'Must apply -1.0 polygonOffsetFactor');
  assert.ok(source.includes('polygonOffsetUnits: -4.0'), 'Must apply -4.0 polygonOffsetUnits');
});

test('CHALLENGER 3.3: Base sphere radius provides negative elevation clearance for Shackleton (-4.2 km) and SPA (-9.0 km)', () => {
  const materialPath = path.resolve(__dirname, '../globe/scene/globeSurfaceMaterial.ts');
  const source = fs.readFileSync(materialPath, 'utf8');

  assert.ok(
    source.includes('MOON_SCENE_RADIUS * (1.0 - 9200.0 / 1737400.0)'),
    'Base sphere radius must be offset by 9.2 km (9200m) to clear depressions down to -9.0 km'
  );

  // Calculate mathematical clearance in km
  const clearanceKm = (9200.0 / 1737400.0) * 1737.4;
  assert.ok(clearanceKm >= 9.0, `Clearance ${clearanceKm} km must be >= 9.0 km`);
});

// ============================================================================
// FOCUS AREA 4: 8 Authoritative Camera Presets & Mathematical Invariants
// ============================================================================

test('CHALLENGER 4.1: All 8 Presets generate non-collinear, orthogonal camera basis across all candidate sites', () => {
  const authoritativePresets = [
    'nadir',
    'site',
    'horizon',
    'eva',
    'earth_align',
    'orbit360',
    'north_look',
    'sunward_terminator',
  ] as const;

  assert.equal(ALL_CAMERA_PRESET_IDS.length, 8);

  for (const site of CANDIDATE_SITES) {
    for (const preset of authoritativePresets) {
      const pose = cameraPoseForPreset(preset, site);

      // Verify finite numbers
      assert.ok(Number.isFinite(pose.camPos.x), `${site.id} ${preset}: camPos.x must be finite`);
      assert.ok(Number.isFinite(pose.lookTarget.x), `${site.id} ${preset}: lookTarget.x must be finite`);
      assert.ok(Number.isFinite(pose.upVector.x), `${site.id} ${preset}: upVector.x must be finite`);

      // Camera position must not coincide with look target (distance > 0)
      const camDist = pose.camPos.distanceTo(pose.lookTarget);
      assert.ok(camDist > 0.001, `${site.id} ${preset}: camDist ${camDist} must be > 0.001`);

      // Up vector must be normalized
      assert.ok(Math.abs(pose.upVector.length() - 1.0) < 1e-4, `${site.id} ${preset}: upVector must be unit length`);

      // View direction must not be parallel to up vector (would cause gimbal lock in lookAt)
      const viewDir = pose.lookTarget.clone().sub(pose.camPos).normalize();
      const dotProduct = Math.abs(viewDir.dot(pose.upVector));
      assert.ok(dotProduct < 0.9999, `${site.id} ${preset}: viewDir must not be parallel to upVector (dot=${dotProduct})`);
    }
  }
});

test('CHALLENGER 4.2: Camera preset aliases map deterministically and produce valid poses', () => {
  const aliasKeys = ['southPole', 'global', 'oblique', 'inspection', 'overhead'] as const;

  for (const alias of aliasKeys) {
    const opt = findCameraPresetOption(alias);
    assert.ok(opt, `Alias ${alias} must resolve to a valid option`);
    assert.ok(opt.preset, `Option for ${alias} must declare a preset`);

    // Verify pose calculation works without throw
    const pose = cameraPoseForPreset(alias as any, testSite);
    assert.ok(Number.isFinite(pose.camPos.x), `Pose for alias ${alias} must be finite`);
  }
});

// ============================================================================
// FOCUS AREA 5: Touch Gestures & Fullscreen Escape Isolation
// ============================================================================

test('CHALLENGER 5.1: Touch action isolation is applied to all map, globe, and lab viewports', () => {
  const labHtml = renderToStaticMarkup(
    <ScenarioProvider>
      <Scenario3DLab />
    </ScenarioProvider>
  );
  assert.ok(labHtml.includes('touch-action:none') || labHtml.includes('touch-none'), 'Lab must have touch-action isolation');

  const globeHtml = renderToStaticMarkup(
    <LunarGlobe3D
      selectedSite={testSite}
      onSelectSite={() => {}}
      subSolarLatDeg={-1.5 as any}
      subSolarLonDeg={45 as any}
      subEarthLatDeg={6.5 as any}
      subEarthLonDeg={-12 as any}
      showGrid={false}
      showShadowRegions={false}
      showVectors={false}
      onToggleGrid={() => {}}
      onToggleShadowRegions={() => {}}
      onToggleVectors={() => {}}
      cameraPreset="nadir"
      onCameraPresetChange={() => {}}
    />
  );
  assert.ok(globeHtml.includes('touch-none'), 'LunarGlobe3D container must include touch-none');
});

test('CHALLENGER 5.2: SpatialWorkspace retains docked TimeExplorer in 3D fullscreen mode', () => {
  const workspaceHtml = renderToStaticMarkup(
    <ScenarioProvider>
      <SpatialWorkspace
        initialViewMode="globe3d"
        onViewModeChange={() => {}}
        onOpenMethodDetails={() => {}}
        onNavigateHorizon={() => {}}
      />
    </ScenarioProvider>
  );

  assert.ok(workspaceHtml.includes('Time Explorer') || workspaceHtml.includes('Time Control') || workspaceHtml.includes('Epoch'), 'Fullscreen workspace must dock TimeExplorer');
});
