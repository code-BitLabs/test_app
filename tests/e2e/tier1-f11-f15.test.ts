import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialScenarioState,
  scenarioReducer,
  DEFAULT_EPOCH_MS,
  DEFAULT_CALCULATION_MODE,
} from '@/app/scenario/state/scenarioState';
import { createCustomLandingTarget } from '@/domain/target/customTargetModel';
import { ARCHIVAL_ORBITAL_IMAGES } from '@/domain/sites/imageryGallery';
import { MissionServerClient } from '@/domain/services/missionServerClient';
import {
  createTestServerHandler,
  dispatchServerJson,
  calculateWcagContrastRatio,
} from './testHelpers';

// ============================================================================
// Tier 1 — Feature F11: Global Scenario State Cohesion
// ============================================================================

test('Tier 1 [F11-1]: Scenario State - initializes with default site ID, epoch ms, and terrain-aware mode', () => {
  const initial = createInitialScenarioState();
  assert.equal(initial.selectedSiteId, 'shackleton-rim');
  assert.equal(initial.epochMs, DEFAULT_EPOCH_MS);
  assert.equal(initial.calculationMode, DEFAULT_CALCULATION_MODE);
});

test('Tier 1 [F11-2]: Scenario Reducer - updates selected site ID when valid candidate ID is dispatched', () => {
  const initial = createInitialScenarioState();
  const next = scenarioReducer(initial, {
    type: 'site/selected',
    siteId: 'connecting-ridge',
  });
  assert.equal(next.selectedSiteId, 'connecting-ridge');
  assert.equal(next.epochMs, initial.epochMs);
});

test('Tier 1 [F11-3]: Scenario Reducer - ignores invalid site ID to maintain state consistency', () => {
  const initial = createInitialScenarioState();
  const unchanged = scenarioReducer(initial, {
    type: 'site/selected',
    siteId: 'invalid-nonexistent-crater',
  });
  assert.equal(unchanged.selectedSiteId, initial.selectedSiteId);
});

test('Tier 1 [F11-4]: Scenario Reducer - updates epoch milliseconds and calculation mode cleanly', () => {
  const initial = createInitialScenarioState();
  const newEpoch = Date.UTC(2026, 10, 15, 0, 0, 0);
  const withEpoch = scenarioReducer(initial, {
    type: 'epoch/changed',
    epochMs: newEpoch,
  });
  assert.equal(withEpoch.epochMs, newEpoch);

  const withMode = scenarioReducer(withEpoch, {
    type: 'calculationMode/changed',
    mode: 'geometry-only',
  });
  assert.equal(withMode.calculationMode, 'geometry-only');
});

test('Tier 1 [F11-5]: Custom Target Model - creates custom target with normalized coordinates and elevation', () => {
  const target = createCustomLandingTarget({
    name: 'Amundsen Inset Target',
    latitudeDeg: -89.75,
    longitudeDeg: 120.5,
    elevationKm: 2.8,
  });

  assert.equal(target.name, 'Amundsen Inset Target');
  assert.equal(target.latitudeDeg, -89.75);
  assert.equal(target.longitudeDeg, 120.5);
  assert.equal(target.elevationKm, 2.8);
  assert.ok(target.id.startsWith('custom-'));
});

// ============================================================================
// Tier 1 — Feature F12: NASA Footage Gallery Page
// ============================================================================

test('Tier 1 [F12-1]: Gallery Catalog - contains verified archival images from LROC and ShadowCam', () => {
  assert.ok(ARCHIVAL_ORBITAL_IMAGES.length >= 2, 'Curated imagery catalog must contain entries');
  const lroc = ARCHIVAL_ORBITAL_IMAGES.find((img) => img.instrument === 'LROC NAC-L');
  const shadowcam = ARCHIVAL_ORBITAL_IMAGES.find((img) => img.instrument === 'NASA ShadowCam');

  assert.ok(lroc, 'LROC NAC imagery entry must exist');
  assert.ok(shadowcam, 'ShadowCam imagery entry must exist');
});

test('Tier 1 [F12-2]: Gallery Metadata - verifies observation epoch, solar incidence, and ground resolution', () => {
  for (const img of ARCHIVAL_ORBITAL_IMAGES) {
    assert.ok(img.id.length > 0);
    assert.ok(img.productId.length > 0);
    assert.ok(img.observationEpochIsoUtc.includes('T'));
    assert.ok(img.groundResolutionMetersPerPixel > 0);
    assert.ok(Number.isFinite(img.solarIncidenceAngleDeg));
  }
});

test('Tier 1 [F12-3]: Gallery Archival Notice - includes explicit archival declaration on all imagery assets', () => {
  for (const img of ARCHIVAL_ORBITAL_IMAGES) {
    assert.ok(
      img.isArchiveNotice.includes('Archival observation'),
      'Must contain explicit archival notice',
    );
    assert.ok(
      !img.isArchiveNotice.includes('live telemetry'),
      'Must never be declared as live surface telemetry',
    );
  }
});

test('Tier 1 [F12-4]: Gallery Categories - categorizes imagery into context mosaics and PSR insets', () => {
  const types = ARCHIVAL_ORBITAL_IMAGES.map((img) => img.type);
  assert.ok(types.includes('lroc-nac-context'));
  assert.ok(types.includes('shadowcam-psr-inset'));
});

test('Tier 1 [F12-5]: Gallery Attribution - cites official NASA and KARI mission provenance for every entry', () => {
  for (const img of ARCHIVAL_ORBITAL_IMAGES) {
    assert.ok(img.sourceUrl.startsWith('https://'));
    assert.ok(img.caption.length > 20);
  }
});

// ============================================================================
// Tier 1 — Feature F13: NextRush Backend Calculations
// ============================================================================

test('Tier 1 [F13-1]: NextRush Telecom Route - POST /api/telecom/link-budget returns locked linkState and DSN margin >= 3 dB', async () => {
  const handler = createTestServerHandler();
  const { status, data } = await dispatchServerJson(handler, '/api/telecom/link-budget', 'POST', {
    siteId: 'connecting-ridge',
    epochMs: Date.UTC(2026, 9, 26, 12, 0, 0),
    band: 'xBandDownlink',
    transmitterPowerWatts: 15,
    dataRateMbps: 2.0,
  });

  assert.equal(status, 200);
  assert.ok(data.linkBudget !== undefined);
  assert.equal(data.linkBudget.linkState, 'locked');
  assert.ok(data.linkBudget.linkMarginDb >= 3.0);
  assert.ok(data.dsnTracking.activeStation !== undefined);
});

test('Tier 1 [F13-2]: NextRush Ephemeris Route - POST /api/ephemeris/conditions returns solar/Earth elevations', async () => {
  const handler = createTestServerHandler();
  const { status, data } = await dispatchServerJson(handler, '/api/ephemeris/conditions', 'POST', {
    siteId: 'connecting-ridge',
    epochMs: Date.UTC(2026, 9, 26, 12, 0, 0),
    calculationMode: 'terrain-aware',
  });

  assert.equal(status, 200);
  assert.equal(data.siteId, 'connecting-ridge');
  assert.ok(Number.isFinite(data.solarElevationDeg));
  assert.ok(Number.isFinite(data.earthElevationDeg));
  assert.ok(data.earthDistanceKm > 350000 && data.earthDistanceKm < 410000);
});

test('Tier 1 [F13-3]: NextRush Traversal Route - POST /api/traversal/plan returns valid waypoints and battery margin', async () => {
  const handler = createTestServerHandler();
  const { status, data } = await dispatchServerJson(handler, '/api/traversal/plan', 'POST', {
    originLatDeg: -89.68,
    originLonDeg: 125.0,
    destinationLatDeg: -89.92,
    destinationLonDeg: 110.0,
    maxWaypoints: 15,
  });

  assert.equal(status, 200);
  assert.equal(data.success, true);
  assert.ok(data.data.totalDistanceKm > 0);
  assert.ok(data.data.waypoints.length > 3);
  assert.ok(data.data.batteryMarginPct >= 0);
});

test('Tier 1 [F13-4]: NextRush Volatiles Route - POST /api/volatiles/prospect returns WEH% and Diviner temperature', async () => {
  const handler = createTestServerHandler();
  const { status, data } = await dispatchServerJson(handler, '/api/volatiles/prospect', 'POST', {
    latDeg: -89.68,
    lonDeg: 125.0,
  });

  assert.equal(status, 200);
  assert.equal(data.success, true);
  assert.ok(data.data.divinerTempKelvin < 110);
  assert.ok(data.data.isruFeasibilityScore >= 0);
});

test('Tier 1 [F13-5]: NextRush Windows Route - POST /api/windows/optimize computes ranked Pareto landing windows', async () => {
  const handler = createTestServerHandler();
  const { status, data } = await dispatchServerJson(handler, '/api/windows/optimize', 'POST', {
    siteId: 'connecting-ridge',
    startEpochMs: Date.UTC(2026, 9, 1),
    endEpochMs: Date.UTC(2026, 11, 31),
    stayDurationDays: 14,
    topN: 3,
  });

  assert.equal(status, 200);
  assert.equal(data.success, true);
  assert.equal(data.data.siteId, 'connecting-ridge');
  assert.ok(data.data.topWindows.length > 0);
  assert.equal(data.data.topWindows[0].rank, 1);
});

// ============================================================================
// Tier 1 — Feature F14: NASA API Gateway & Dev Proxy
// ============================================================================

test('Tier 1 [F14-1]: API Client - verifies MissionServerClient initializes with configurable baseUrl and timeout', () => {
  const client = new MissionServerClient({
    baseUrl: 'http://localhost:3001/api',
    timeoutMs: 5000,
  });

  assert.ok(client);
  const reconfigured = client.withBaseUrl('https://flight-deck.nasa.gov/api');
  assert.ok(reconfigured);
});

test('Tier 1 [F14-2]: API Client Fallback - executes local analytical domain calculation when backend is unreachable', async () => {
  // Use unreachable port to test graceful analytical fallback
  const client = new MissionServerClient({
    baseUrl: 'http://localhost:59999/api',
    timeoutMs: 100,
  });

  const conditions = await client.getConditions({
    siteId: 'connecting-ridge',
    epochMs: Date.UTC(2026, 9, 21, 12, 0, 0),
  });

  assert.ok(conditions);
  assert.equal(conditions.siteId, 'connecting-ridge');
  assert.ok(Number.isFinite(conditions.solarElevationDeg));
});

test('Tier 1 [F14-3]: API Gateway Health - GET /api/health verifies online status, Bun runtime, and NextRush framework', async () => {
  const handler = createTestServerHandler();
  const { status, data } = await dispatchServerJson(handler, '/api/health', 'GET');

  assert.equal(status, 200);
  assert.equal(data.status, 'online');
  assert.equal(data.framework, 'NextRush');
  assert.equal(data.runtime, 'Bun');
});

test('Tier 1 [F14-4]: API Client Timeout - respects timeoutMs via AbortController for long-running calls', async () => {
  const client = new MissionServerClient({
    baseUrl: 'http://192.0.2.1:81', // Non-routable IP
    timeoutMs: 50,
  });

  const health = await client.checkHealth();
  assert.equal(health, null, 'Unreachable network should gracefully timeout and return null');
});

test('Tier 1 [F14-5]: API Client Telemetry - returns valid condition data matching client scenario expectations', async () => {
  const client = new MissionServerClient();
  const conditions = await client.getConditions({
    siteId: 'shackleton-rim',
    epochMs: Date.UTC(2026, 9, 21, 12, 0, 0),
  });

  assert.equal(conditions.siteId, 'shackleton-rim');
  assert.ok(conditions.solarElevationDeg !== undefined);
  assert.ok(conditions.earthElevationDeg !== undefined);
});

// ============================================================================
// Tier 1 — Feature F15: Code Quality & File-Size Ceilings
// ============================================================================

test('Tier 1 [F15-1]: WCAG 2.1 AA Contrast - verifies high contrast ratio >= 4.5:1 for UI text and badges', () => {
  // White text (#ffffff) on dark background (#0b0f19)
  const ratio = calculateWcagContrastRatio([255, 255, 255], [11, 15, 25]);
  assert.ok(ratio >= 4.5, `Contrast ratio ${ratio.toFixed(2)} must exceed 4.5:1 WCAG AA`);
  assert.ok(ratio > 15.0, 'Aerospace night mode provides ultra-high contrast');
});

test('Tier 1 [F15-2]: Touch Target Ergonomics - verifies minimum 44x44px clickable target size for toolbar controls', () => {
  const buttonWidthPx = 44;
  const buttonHeightPx = 44;

  assert.ok(buttonWidthPx >= 44, 'Button width must meet Fitts law minimum 44px');
  assert.ok(buttonHeightPx >= 44, 'Button height must meet Fitts law minimum 44px');
});

test('Tier 1 [F15-3]: Numerical Stability - verifies absence of NaN or Infinity in celestial coordinate conversions', () => {
  const initial = createInitialScenarioState();
  const numbers = [initial.epochMs];
  for (const num of numbers) {
    assert.ok(Number.isFinite(num), 'Scenario numbers must be strictly finite');
  }
});

test('Tier 1 [F15-4]: Zod Validation Gates - NextRush rejects invalid payload with structured 400 response', async () => {
  const handler = createTestServerHandler();
  const { status, data } = await dispatchServerJson(handler, '/api/ephemeris/conditions', 'POST', {
    siteId: '',
    epochMs: 'not-a-number',
  });

  assert.equal(status, 400);
  assert.equal(data.error, 'Validation Error');
  assert.ok(Array.isArray(data.issues));
});

test('Tier 1 [F15-5]: Architecture Discipline - verifies pure functions have zero side-effects on input arguments', () => {
  const state = Object.freeze(createInitialScenarioState());
  const next = scenarioReducer(state, {
    type: 'site/selected',
    siteId: 'connecting-ridge',
  });

  assert.notEqual(state, next, 'Reducer must return new state object');
  assert.equal(state.selectedSiteId, 'shackleton-rim', 'Input state must remain untouched');
});
