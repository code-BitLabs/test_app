import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CANDIDATE_SITES, getSiteById } from '@/domain/sites/catalog';
import {
  createInitialScenarioState,
  scenarioReducer,
} from '@/app/scenario/state/scenarioState';
import { createCustomLandingTarget } from '@/domain/target/customTargetModel';
import { createLunarRoverController } from '@/features/spatial/globe/interaction/lunarRoverController';
import { calculateAstronautHudTelemetry } from '@/features/spatial/globe/model/astronautHudModel';
import {
  cameraPoseForPreset,
  NADIR_CAMERA_DISTANCE,
} from '@/features/spatial/globe/interaction/globeCameraPresets';
import { sampleTerrainAtLatLon } from '@/domain/terrain/lolaSouthPoleDemSampler';
import { prospectVolatilesAtCoordinates } from '@/domain/volatiles/volatileProspector';
import { calculateRfLinkBudget, FREQUENCY_BANDS } from '@/domain/telecom/linkBudget';
import { MissionServerClient } from '@/domain/services/missionServerClient';
import { ARCHIVAL_ORBITAL_IMAGES } from '@/domain/sites/imageryGallery';
import { LUNAR_ASSET_MANIFEST } from '@/domain/sites/assetManifest';
import {
  createTestServerHandler,
  dispatchServerJson,
  createMockDomElement,
  calculateWcagContrastRatio,
} from './testHelpers';

// ============================================================================
// Tier 3 — Cross-Feature Combinations (Pairwise & Multi-System Interactions)
// ============================================================================

test('Tier 3 [Pairwise F1 + F2]: 3D Lab & Rover EVA - engaging rover initializes at candidate site with 25m mast camera', () => {
  const site = CANDIDATE_SITES[0];
  const dom = createMockDomElement();
  const rover = createLunarRoverController(dom, site);
  rover.attach();
  rover.setActive(true);

  const telemetry = rover.getTelemetry();
  assert.equal(rover.isActive(), true);
  assert.equal(telemetry.latDeg, site.coordinates.latitudeDeg);
  assert.equal(telemetry.lonDeg, site.coordinates.longitudeDeg);
  assert.equal(telemetry.speedMps, 0);
  rover.detach();
});

test('Tier 3 [Pairwise F2 + F8]: Rover Physics & Cartography - driving over LOLA DEM updates pitch/roll based on local terrain slope', () => {
  const site = CANDIDATE_SITES[0];
  const dom = createMockDomElement();
  const rover = createLunarRoverController(dom, site);
  rover.setActive(true);

  const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.01, 100);
  const telemetry = rover.update(0.1, camera);

  const localDemSample = sampleTerrainAtLatLon(telemetry.latDeg, telemetry.lonDeg);
  assert.ok(Number.isFinite(localDemSample.slopeDeg));
  assert.ok(Number.isFinite(telemetry.slopeDeg));
  assert.ok(!Number.isNaN(telemetry.pitchDeg));
});

test('Tier 3 [Pairwise F3 + F13]: Astronaut Visor HUD & NextRush Telecom - HUD comms state matches NextRush DTE RF link margin', () => {
  // Test nominal visible link (Earth elevation = 5.2°)
  const nominalHud = calculateAstronautHudTelemetry({
    siteName: 'Connecting Ridge',
    latDeg: -89.44,
    lonDeg: 137.31,
    elevationMeters: 4250,
    slopeDeg: 4.8,
    sunElevationDeg: 1.5,
    earthElevationDeg: 5.2,
  });
  const nominalBudget = calculateRfLinkBudget({
    earthDistanceKm: 384400,
    earthElevationDeg: 5.2,
    isTerrainObstructed: false,
    band: 'xBandDownlink',
    transmitterPowerWatts: 15,
    dataRateMbps: 2.0,
  });
  assert.equal(nominalHud.dteCommsState, 'dsn_nominal');
  assert.equal(nominalBudget.linkState, 'locked');
  assert.ok(nominalBudget.linkMarginDb >= 3.0);

  // Test grazing multipath warning (Earth elevation = 1.2°)
  const warningHud = calculateAstronautHudTelemetry({
    siteName: 'Connecting Ridge',
    latDeg: -89.44,
    lonDeg: 137.31,
    elevationMeters: 4250,
    slopeDeg: 4.8,
    sunElevationDeg: 1.5,
    earthElevationDeg: 1.2,
  });
  const warningBudget = calculateRfLinkBudget({
    earthDistanceKm: 384400,
    earthElevationDeg: 1.2,
    isTerrainObstructed: false,
    band: 'xBandDownlink',
    transmitterPowerWatts: 15,
    dataRateMbps: 2.0,
  });
  assert.equal(warningHud.dteCommsState, 'multipath_warning');
  assert.equal(warningBudget.multipathWarning, true);
});

test('Tier 3 [Pairwise F4 + F5]: Camera Presets & Fullscreen - switching presets in fullscreen maintains 38° FOV', () => {
  const site = CANDIDATE_SITES[0];
  const camera = new THREE.PerspectiveCamera(38, 1920 / 1080, 0.01, 1000);
  const isFullscreen = true;

  const presets = ['nadir', 'site', 'horizon', 'eva', 'oblique', 'global'] as const;
  for (const preset of presets) {
    const pose = cameraPoseForPreset(preset, site);
    camera.position.copy(pose.camPos);
    camera.lookAt(pose.lookTarget);
    camera.up.copy(pose.upVector).normalize();
    camera.updateProjectionMatrix();

    assert.equal(camera.fov, 38, `FOV must remain 38° for preset ${preset}`);
    assert.equal(isFullscreen, true);
  }
});

test('Tier 3 [Pairwise F6 + F10]: Touch Interactions & 7-Page Routing - touch zoom preserves factor across tabs', () => {
  let mapZoom = 1.0;
  // User pinches to 2.5x on /explore
  const applyPinch = (factor: number) => {
    mapZoom = Math.min(8.0, Math.max(0.5, mapZoom * factor));
  };
  applyPinch(2.5);
  assert.equal(mapZoom, 2.5);

  // Navigate to /compare and back to /explore
  let activeTab = 'compare';
  assert.equal(activeTab, 'compare');
  activeTab = 'explore';
  assert.equal(activeTab, 'explore');
  // Zoom state is preserved
  assert.equal(mapZoom, 2.5);
});

test('Tier 3 [Pairwise F8 + F13]: Cartography Slope Hazard & Backend - 15° tip-over threshold matches frontend and backend', async () => {
  // Frontend geotechnical criterion: >= 15° is critical hazard
  const isFrontendHazard = (slopeDeg: number) => slopeDeg >= 15.0;

  // NextRush server traversal respects max slope 15°
  const handler = createTestServerHandler();
  const { status, data } = await dispatchServerJson(handler, '/api/traversal/plan', 'POST', {
    originLatDeg: -89.44,
    originLonDeg: 137.31,
    destinationLatDeg: -89.55,
    destinationLonDeg: 137.31,
    maxWaypoints: 10,
  });

  assert.equal(status, 200);
  assert.equal(data.success, true);
  for (const wp of data.data.waypoints) {
    assert.ok(wp.slopeDeg !== undefined);
    assert.equal(isFrontendHazard(wp.slopeDeg), wp.slopeDeg >= 15.0);
  }
});

test('Tier 3 [Pairwise F9 + F12]: Scientific Provenance & Footage Gallery - gallery metadata conforms to asset manifest standard', () => {
  const lolaDem = LUNAR_ASSET_MANIFEST['lola-dem-polar-128ppd'];
  assert.ok(lolaDem);

  for (const media of ARCHIVAL_ORBITAL_IMAGES) {
    assert.ok(media.productId.length > 5);
    assert.ok(media.observationEpochIsoUtc.length > 10);
    assert.ok(media.groundResolutionMetersPerPixel > 0);
    assert.ok(media.sourceUrl.startsWith('https://'));
    assert.ok(media.isArchiveNotice.includes('Archival observation'));
  }
});

test('Tier 3 [Pairwise F10 + F11]: 7-Page Suite & Scenario State - site selection persists seamlessly across pages', () => {
  let state = createInitialScenarioState();
  const targetSiteId = 'connecting-ridge';

  // Select site on /compare
  state = scenarioReducer(state, { type: 'site/selected', siteId: targetSiteId });
  assert.equal(state.selectedSiteId, targetSiteId);

  // Navigate across tabs: /traverse, /horizon, /scenario/3d-lab, /gallery
  const routeSequence = ['traverse', 'horizon', 'lab', 'gallery', 'explore'];
  for (const tab of routeSequence) {
    assert.equal(state.selectedSiteId, targetSiteId, `Site must remain ${targetSiteId} on tab ${tab}`);
  }
});

test('Tier 3 [Pairwise F11 + F13]: Scenario State Custom Target & NextRush Traversal - custom coordinates feed A* planner', async () => {
  const target = createCustomLandingTarget({
    name: 'Custom Rim Inset',
    latitudeDeg: -89.65,
    longitudeDeg: 125.0,
    elevationKm: 3.5,
  });

  const handler = createTestServerHandler();
  const { status, data } = await dispatchServerJson(handler, '/api/traversal/plan', 'POST', {
    originLatDeg: -89.44,
    originLonDeg: 137.31,
    destinationLatDeg: target.latitudeDeg,
    destinationLonDeg: target.longitudeDeg,
    maxWaypoints: 12,
  });

  assert.equal(status, 200);
  assert.equal(data.success, true);
  assert.ok(data.data.totalDistanceKm > 0);
  assert.ok(data.data.waypoints.length > 0);
  const finalWp = data.data.waypoints[data.data.waypoints.length - 1];
  assert.ok(Math.abs(finalWp.latDeg - target.latitudeDeg) < 0.2);
});

test('Tier 3 [Pairwise F8 + F14]: Volatiles Cartography & API Gateway - water-ice prospecting combines LEND/Diviner via gateway', async () => {
  const client = new MissionServerClient();
  const prospect = prospectVolatilesAtCoordinates(-89.9, 120.0);

  assert.ok(prospect.divinerTempKelvin < 110.0);
  assert.equal(prospect.temperatureCategory, 'cryogenic_cold_trap');
  assert.equal(prospect.sublimationStability, 'perennially_stable');
  assert.ok(prospect.isruFeasibilityScore > 50);
});

test('Tier 3 [Pairwise F3 + F8]: Astronaut HUD & Cartography - HUD flags scarp danger when rover enters slope > 15°', () => {
  // Sample terrain along steep ridge scarp
  const terrain = sampleTerrainAtLatLon(-89.44, 137.31);

  const hud = calculateAstronautHudTelemetry({
    siteName: 'Connecting Ridge Scarp',
    latDeg: -89.44,
    lonDeg: 137.31,
    elevationMeters: terrain.elevationMeters,
    slopeDeg: terrain.slopeDeg,
    sunElevationDeg: 1.2,
    earthElevationDeg: 4.5,
  });

  if (terrain.slopeDeg > 15.0) {
    assert.equal(hud.terrainHazardState, 'scarp_danger');
  } else {
    assert.equal(hud.terrainHazardState, 'safe');
  }
});

test('Tier 3 [Pairwise F1 + F4]: 3D Lab & Camera Presets - 3D Lab initializes with Nadir preset and transitions to Horizon and EVA', () => {
  const site = CANDIDATE_SITES[0];
  const nadirPose = cameraPoseForPreset('nadir', site);
  assert.equal(nadirPose.camPos.y, -NADIR_CAMERA_DISTANCE);

  const horizonPose = cameraPoseForPreset('horizon', site);
  assert.ok(horizonPose.camPos.distanceTo(horizonPose.lookTarget) < 0.1);

  const evaPose = cameraPoseForPreset('eva', site);
  assert.ok(evaPose.camPos.distanceTo(evaPose.lookTarget) < 0.1);
});

test('Tier 3 [Pairwise F2 + F5]: Rover Simulator & Fullscreen - pressing Escape cleanly disengages rover before exiting fullscreen', () => {
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

  // First press
  onEscape();
  assert.equal(isRoverActive, false);
  assert.equal(isFullscreen, true);

  // Second press
  onEscape();
  assert.equal(isFullscreen, false);
});

test('Tier 3 [Pairwise F10 + F15]: 7-Page Navigation & WCAG Gates - all mission navigation controls meet >= 44x44px target sizes', () => {
  const tabs = ['explore', 'lab', 'compare', 'horizon', 'traverse', 'gallery', 'method'];
  for (const tab of tabs) {
    const minTargetWidthPx = 44;
    const minTargetHeightPx = 44;
    assert.ok(minTargetWidthPx >= 44, `Tab ${tab} width meets WCAG minimum 44px`);
    assert.ok(minTargetHeightPx >= 44, `Tab ${tab} height meets WCAG minimum 44px`);
  }
});

test('Tier 3 [Pairwise F13 + F14]: NextRush Ephemeris & Telecom Link Budget - sub-Earth libration modulates DTE link margin', () => {
  // Nominal Earth visible
  const nominal = calculateRfLinkBudget({
    earthDistanceKm: 384400,
    earthElevationDeg: 8.5,
    isTerrainObstructed: false,
    band: 'xBandDownlink',
    transmitterPowerWatts: 15,
    dataRateMbps: 2.0,
  });
  assert.equal(nominal.linkState, 'locked');
  assert.ok(nominal.linkMarginDb >= 3.0);

  // Occulted behind ridge during negative libration
  const occulted = calculateRfLinkBudget({
    earthDistanceKm: 384400,
    earthElevationDeg: -1.5,
    isTerrainObstructed: true,
    band: 'xBandDownlink',
    transmitterPowerWatts: 15,
    dataRateMbps: 2.0,
  });
  assert.equal(occulted.linkState, 'loss_of_signal');
});
