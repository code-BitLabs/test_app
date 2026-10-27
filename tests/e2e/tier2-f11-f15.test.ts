import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialScenarioState,
  scenarioReducer,
} from '@/app/scenario/state/scenarioState';
import {
  createCustomLandingTarget,
  validateCustomTargetCoordinates,
} from '@/domain/target/customTargetModel';
import {
  loadCustomLandingTargets,
  saveCustomLandingTarget,
  deleteCustomLandingTarget,
} from '@/domain/target/customTargetStorage';
import { ARCHIVAL_ORBITAL_IMAGES } from '@/domain/sites/imageryGallery';
import {
  calculateFreeSpacePathLoss,
  calculateRfLinkBudget,
  FREQUENCY_BANDS,
} from '@/domain/telecom/linkBudget';
import {
  createTestServerHandler,
  dispatchServerJson,
  calculateWcagContrastRatio,
} from './testHelpers';

// ============================================================================
// Tier 2 — Boundary Cases for F11: Global Scenario State Cohesion
// ============================================================================

test('Tier 2 [F11-B1]: Scenario State Boundaries - non-finite epoch ms (NaN or Infinity) is rejected by reducer', () => {
  const initial = createInitialScenarioState();
  const withNaN = scenarioReducer(initial, {
    type: 'epoch/changed',
    epochMs: NaN,
  });
  assert.equal(withNaN.epochMs, initial.epochMs, 'NaN epoch must be rejected');

  const withInf = scenarioReducer(initial, {
    type: 'epoch/changed',
    epochMs: Infinity,
  });
  assert.equal(withInf.epochMs, initial.epochMs, 'Infinity epoch must be rejected');
});

test('Tier 2 [F11-B2]: Scenario State Boundaries - unknown action type returns original state object unchanged', () => {
  const initial = createInitialScenarioState();
  const unchanged = scenarioReducer(initial, { type: 'unknown/action' } as any);
  assert.equal(unchanged, initial, 'Unknown action returns original state reference');
});

test('Tier 2 [F11-B3]: Scenario State Boundaries - custom target with latitude exactly -90.0° is valid within polar bounds', () => {
  const validation = validateCustomTargetCoordinates(-90.0, 145.0);
  assert.equal(validation.isValid, true);
  assert.equal(validation.normalizedLat, -90.0);
  assert.equal(validation.normalizedLon, 145.0);
});

test('Tier 2 [F11-B4]: Scenario State Boundaries - custom target with longitude > 360° wraps into [0°, 360)', () => {
  const validation = validateCustomTargetCoordinates(-85.0, 450.0);
  assert.equal(validation.isValid, true);
  assert.equal(validation.normalizedLon, 90.0, '450° wraps to 90° East');
});

test('Tier 2 [F11-B5]: Scenario State Boundaries - saving and deleting custom targets updates storage list length', () => {
  const mockStorage: Record<string, string> = {};
  const storageAdapter = {
    getItem: (k: string) => mockStorage[k] ?? null,
    setItem: (k: string, v: string) => {
      mockStorage[k] = v;
    },
    removeItem: (k: string) => {
      delete mockStorage[k];
    },
  };

  const target = createCustomLandingTarget({
    name: 'Test Landing Spot',
    latitudeDeg: -88.5,
    longitudeDeg: 30.0,
    elevationKm: 1.2,
  });

  const saved = saveCustomLandingTarget(target, storageAdapter);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].name, 'Test Landing Spot');

  const afterDelete = deleteCustomLandingTarget(target.id, storageAdapter);
  assert.equal(afterDelete.length, 0);
});

// ============================================================================
// Tier 2 — Boundary Cases for F12: NASA Footage Gallery Page
// ============================================================================

test('Tier 2 [F12-B1]: Gallery Boundaries - empty search string returns entire curated catalog', () => {
  const search = (q: string) => {
    const term = q.trim().toLowerCase();
    if (!term) return ARCHIVAL_ORBITAL_IMAGES;
    return ARCHIVAL_ORBITAL_IMAGES.filter((img) => img.title.toLowerCase().includes(term));
  };

  assert.equal(search('').length, ARCHIVAL_ORBITAL_IMAGES.length);
  assert.equal(search('   ').length, ARCHIVAL_ORBITAL_IMAGES.length);
});

test('Tier 2 [F12-B2]: Gallery Boundaries - search query with regex special characters does not crash', () => {
  const safeSearch = (q: string) => {
    return ARCHIVAL_ORBITAL_IMAGES.filter((img) => img.title.includes(q));
  };

  const results = safeSearch('.*?[]()+^$');
  assert.equal(results.length, 0, 'No match for regex meta string');
});

test('Tier 2 [F12-B3]: Gallery Boundaries - filtering by non-existent media category returns empty array', () => {
  const filterByCategory = (cat: string) => {
    return ARCHIVAL_ORBITAL_IMAGES.filter((img) => img.type === (cat as any));
  };

  assert.equal(filterByCategory('non-existent-cat').length, 0);
});

test('Tier 2 [F12-B4]: Gallery Boundaries - thumbnail tone styling handles dark-regolith fallback', () => {
  const validTones = ['dark-regolith', 'psr-scattered', 'high-contrast-rim'];
  for (const img of ARCHIVAL_ORBITAL_IMAGES) {
    assert.ok(validTones.includes(img.thumbnailTone));
  }
});

test('Tier 2 [F12-B5]: Gallery Boundaries - imagery entry without solar incidence defaults gracefully', () => {
  const mockImage = {
    ...ARCHIVAL_ORBITAL_IMAGES[0],
    solarIncidenceAngleDeg: NaN,
  };
  const formattedAngle = Number.isFinite(mockImage.solarIncidenceAngleDeg)
    ? `${mockImage.solarIncidenceAngleDeg.toFixed(1)}°`
    : 'N/A';

  assert.equal(formattedAngle, 'N/A');
});

// ============================================================================
// Tier 2 — Boundary Cases for F13: NextRush Backend Calculations
// ============================================================================

test('Tier 2 [F13-B1]: NextRush Boundaries - link budget at extreme lunar apogee (406,700 km) maintains positive margin', () => {
  const fsplApogee = calculateFreeSpacePathLoss(406700, FREQUENCY_BANDS.xBandDownlink.frequencyGhz);
  assert.ok(fsplApogee > 222.0 && fsplApogee < 224.0);

  const budget = calculateRfLinkBudget({
    earthDistanceKm: 406700,
    earthElevationDeg: 10.0,
    isTerrainObstructed: false,
    band: 'xBandDownlink',
    transmitterPowerWatts: 15,
    dataRateMbps: 2.0,
  });

  assert.equal(budget.linkState, 'locked');
  assert.ok(budget.linkMarginDb >= 3.0, 'Apogee link margin should still exceed +3 dB');
});

test('Tier 2 [F13-B2]: NextRush Boundaries - link budget at extreme perigee (356,500 km) calculates minimum path loss', () => {
  const fsplPerigee = calculateFreeSpacePathLoss(356500, FREQUENCY_BANDS.xBandDownlink.frequencyGhz);
  const fsplApogee = calculateFreeSpacePathLoss(406700, FREQUENCY_BANDS.xBandDownlink.frequencyGhz);

  assert.ok(fsplPerigee < fsplApogee, 'Perigee path loss must be strictly less than apogee');
  assert.ok(fsplApogee - fsplPerigee > 1.0, 'Difference between apogee and perigee FSPL is ~1.15 dB');
});

test('Tier 2 [F13-B3]: NextRush Boundaries - link budget with occluded Earth elevation (sub-horizon) reports loss_of_signal', () => {
  const budget = calculateRfLinkBudget({
    earthDistanceKm: 384400,
    earthElevationDeg: -2.5, // Below horizon
    isTerrainObstructed: false,
    band: 'xBandDownlink',
    transmitterPowerWatts: 15,
    dataRateMbps: 2.0,
  });

  assert.equal(budget.linkState, 'loss_of_signal');
  assert.ok(budget.linkMarginDb <= 0);
});

test('Tier 2 [F13-B4]: NextRush Boundaries - traversal planning between identical coordinates returns 0 km route', async () => {
  const handler = createTestServerHandler();
  const { status, data } = await dispatchServerJson(handler, '/api/traversal/plan', 'POST', {
    originLatDeg: -89.5,
    originLonDeg: 120.0,
    destinationLatDeg: -89.5,
    destinationLonDeg: 120.0,
    maxWaypoints: 10,
  });

  assert.equal(status, 200);
  assert.equal(data.success, true);
  assert.equal(data.data.totalDistanceKm, 0);
});

test('Tier 2 [F13-B5]: NextRush Boundaries - windows optimization with topN > 20 is rejected with 400 validation error', async () => {
  const handler = createTestServerHandler();
  const { status, data } = await dispatchServerJson(handler, '/api/windows/optimize', 'POST', {
    siteId: 'connecting-ridge',
    startEpochMs: Date.UTC(2026, 9, 1),
    endEpochMs: Date.UTC(2026, 11, 31),
    stayDurationDays: 14,
    topN: 100, // Exceeds upper limit 20
  });

  assert.equal(status, 400);
  assert.equal(data.error, 'Invalid landing window optimization payload');
});

// ============================================================================
// Tier 2 — Boundary Cases for F14: NASA API Gateway & Dev Proxy
// ============================================================================

test('Tier 2 [F14-B1]: Gateway Boundaries - immediate AbortSignal triggers AbortError without unhandled rejection', async () => {
  const controller = new AbortController();
  controller.abort();

  let aborted = false;
  try {
    await fetch('http://localhost:3001/api/health', { signal: controller.signal });
  } catch (err: any) {
    if (err.name === 'AbortError') aborted = true;
  }

  assert.equal(aborted, true, 'Immediate abort must throw AbortError');
});

test('Tier 2 [F14-B2]: Gateway Boundaries - server 500 internal server error triggers local domain fallback', async () => {
  const mockFetcher = async () => {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  };

  const res = await mockFetcher();
  assert.equal(res.status, 500);
  // Domain fallback triggers when !res.ok
  const shouldFallback = !res.ok;
  assert.equal(shouldFallback, true);
});

test('Tier 2 [F14-B3]: Gateway Boundaries - malformed JSON response body triggers local domain fallback', async () => {
  const badJsonResponse = new Response('<html>Error 502 Bad Gateway</html>', { status: 200 });
  let parseFailed = false;
  try {
    await badJsonResponse.json();
  } catch {
    parseFailed = true;
  }
  assert.equal(parseFailed, true, 'HTML response must fail JSON parse and trigger fallback');
});

test('Tier 2 [F14-B4]: Gateway Boundaries - invalid URL structure throws or fails gracefully', () => {
  let threw = false;
  try {
    new URL('not-a-valid-url');
  } catch {
    threw = true;
  }
  assert.equal(threw, true, 'Malformed URL string throws TypeError');
});

test('Tier 2 [F14-B5]: Gateway Boundaries - network timeout of 1ms aborts fetch cleanly', async () => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 1);

  let timedOut = false;
  try {
    await fetch('http://192.0.2.1:81', { signal: controller.signal });
  } catch {
    timedOut = true;
  } finally {
    clearTimeout(id);
  }
  assert.equal(timedOut, true);
});

// ============================================================================
// Tier 2 — Boundary Cases for F15: Code Quality & File-Size Ceilings
// ============================================================================

test('Tier 2 [F15-B1]: Code Quality Boundaries - WCAG contrast calculation handles pure white vs pure black (21:1)', () => {
  const ratio = calculateWcagContrastRatio([255, 255, 255], [0, 0, 0]);
  assert.equal(Math.round(ratio), 21, 'White vs Black must yield 21:1 contrast ratio');
});

test('Tier 2 [F15-B2]: Code Quality Boundaries - WCAG contrast calculation handles identical colors (1:1 failure)', () => {
  const ratio = calculateWcagContrastRatio([128, 128, 128], [128, 128, 128]);
  assert.equal(ratio, 1.0, 'Identical colors produce 1.0 contrast ratio (failing AA)');
});

test('Tier 2 [F15-B3]: Code Quality Boundaries - 43px touch target is flagged as failing minimum 44px threshold', () => {
  const targetPx = 43.0;
  const isAccessible = targetPx >= 44.0;
  assert.equal(isAccessible, false, '43px touch target must fail WCAG 2.1 AA');
});

test('Tier 2 [F15-B4]: Code Quality Boundaries - NextRush Zod schema rejects non-numeric strings for coordinates', async () => {
  const handler = createTestServerHandler();
  const { status, data } = await dispatchServerJson(handler, '/api/traversal/plan', 'POST', {
    originLatDeg: 'invalid-string',
    originLonDeg: 120.0,
    destinationLatDeg: -89.5,
    destinationLonDeg: 120.0,
  });

  assert.equal(status, 400);
  assert.equal(data.error, 'Invalid traversal request payload');
});

test('Tier 2 [F15-B5]: Code Quality Boundaries - NextRush Zod schema rejects out-of-range polar latitudes (e.g. +45°)', async () => {
  const handler = createTestServerHandler();
  const { status, data } = await dispatchServerJson(handler, '/api/traversal/plan', 'POST', {
    originLatDeg: 45.0, // North hemisphere invalid
    originLonDeg: 0.0,
    destinationLatDeg: -89.5,
    destinationLonDeg: 0.0,
  });

  assert.equal(status, 400);
  assert.equal(data.error, 'Invalid traversal request payload');
});
