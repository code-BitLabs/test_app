/**
 * Tier 5 Adversarial Coverage Hardening Test Suite
 *
 * Exhaustive adversarial stress testing covering:
 * - Suite 1: Extreme Astrodynamic & Geotechnical Limit Adversarial Stress (ADV-1..ADV-5)
 * - Suite 2: High-Frequency Concurrent State Mutations & Temporal Scrubbing (ADV-6..ADV-9)
 * - Suite 3: Offline Network Faults, Cache Eviction & Resiliency (ADV-10..ADV-14)
 * - Suite 4: Touch Gestures & Gesture Isolation Under Adversarial Input (ADV-15..ADV-18)
 *
 * File-size ceiling: Strictly <= 500 lines.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { computeTopocentricAngles, calculateLunarEphemeris } from '@/domain/celestial/ephemeris';
import { sampleLolaTerrain, sampleLolaElevationAtLatLon } from '@/domain/terrain/lolaSouthPoleDemSampler';
import {
  calculateBeckmannFromStats,
  calculateBeckmannFromElevations,
  calculateSlopeRoughnessAtCoordinates,
} from '@/domain/terrain/beckmannRoughness';
import {
  evaluateLandingSafety,
  calculateSlopeFactorScore,
  calculateRoughnessFactorScore,
} from '@/domain/safety/landingSafetyIndex';
import {
  calculateRfLinkBudget,
  calculateFreeSpacePathLoss,
  FREQUENCY_BANDS,
} from '@/domain/telecom/linkBudget';
import { createInitialScenarioState, scenarioReducer } from '@/app/scenario/state/scenarioState';
import { resolveTabFromPath, resolvePathFromTab } from '@/app/hooks/useMissionRouter';
import { horizonsProxyService, HorizonsLruCache } from '@server/services/horizonsProxyService';
import { nasaMediaProxyService, MediaLruCache } from '@server/services/nasaMediaProxyService';
import { createTestServerHandler, dispatchServerJson } from './testHelpers';
import { CANDIDATE_SITES } from '@/domain/sites/catalog';
import {
  calculate2DPanSensitivity,
  computeZoomAwarePan,
  calculate3DOrbitSensitivity,
  DEFAULT_ORBIT_SENSITIVITY_CONFIG,
} from '@/features/spatial/interaction/zoomAwareInteractionModel';
import {
  clampZoom,
  steppedZoom,
  wheelZoom,
  clampPan,
  zoomAroundScreenPoint,
  ZOOM_MIN,
  ZOOM_MAX,
} from '@/features/spatial/map/model/mapViewportMath';
import {
  CONTROL_MIN_DISTANCE,
  CONTROL_MAX_DISTANCE,
  CAMERA_NEAR,
  MOON_SCENE_RADIUS,
} from '@/features/spatial/globe/scene/globeScene';

// ============================================================================
// Suite 1: Extreme Astrodynamic & Geotechnical Limit Adversarial Stress
// ============================================================================

test('Tier 5 [ADV-1]: Astrodynamic Limits - Exact -90.0° geographic South Pole avoids azimuth singularity and computes non-NaN topocentric elevation under maximum solar tilt (±1.54°)', () => {
  // At -90.0°S, solar tilt ±1.54° maps directly to elevation ∓(-1.54) = ±1.54°
  const southTilt = computeTopocentricAngles(-90.0, 0.0, -1.54, 180.0);
  assert.ok(Number.isFinite(southTilt.elevationDeg));
  assert.ok(Math.abs(southTilt.elevationDeg - 1.54) < 0.01, 'Sub-solar elevation must equal +1.54°');
  assert.ok(southTilt.azimuthDeg >= 0 && southTilt.azimuthDeg <= 360);

  const northTilt = computeTopocentricAngles(-90.0, 0.0, 1.54, 0.0);
  assert.ok(Math.abs(northTilt.elevationDeg - (-1.54)) < 0.01, 'Sub-solar elevation must equal -1.54°');

  // Verify LOLA terrain sampler floor cosLat clamp avoids division by zero
  const terrain = sampleLolaTerrain(-90.0, 0.0);
  assert.ok(Number.isFinite(terrain.elevationMeters));
  assert.ok(Number.isFinite(terrain.slopeDeg));
  assert.ok(terrain.slopeDeg <= 85.0);
  assert.ok(terrain.hillshade >= 0.05 && terrain.hillshade <= 1.0);
});

test('Tier 5 [ADV-2]: Geotechnical Limit - Extreme 85.0° slope scarp triggers strictly clamped gradient and mandatory ABORT tip-over hazard', () => {
  // Evaluates safety at extreme 85° slope
  const safetyExtreme = evaluateLandingSafety({
    slopeDeg: 85.0,
    illuminationPct: 80.0,
    earthVisibilityPct: 80.0,
    volatilesScore: 50.0,
    roughnessTheta0Deg: 4.0,
  });
  assert.equal(safetyExtreme.breakdown.slopeScore, 0);
  assert.equal(safetyExtreme.isTipOverHazard, true);
  assert.ok(safetyExtreme.hazardFlags.includes('TIP_OVER_HAZARD'));
  assert.equal(safetyExtreme.recommendation, 'ABORT');

  // Exact 15.0° threshold test
  const at14_99 = evaluateLandingSafety({
    slopeDeg: 14.99,
    illuminationPct: 90.0,
    earthVisibilityPct: 90.0,
    volatilesScore: 80.0,
    roughnessTheta0Deg: 2.0,
  });
  assert.equal(at14_99.isTipOverHazard, false);
  assert.ok(at14_99.hazardFlags.includes('ELEVATED_SLOPE'));
  assert.equal(at14_99.recommendation, 'CAUTION');

  const at15_00 = evaluateLandingSafety({
    slopeDeg: 15.00,
    illuminationPct: 90.0,
    earthVisibilityPct: 90.0,
    volatilesScore: 80.0,
    roughnessTheta0Deg: 2.0,
  });
  assert.equal(at15_00.isTipOverHazard, true);
  assert.equal(at15_00.recommendation, 'ABORT');
});

test('Tier 5 [ADV-3]: Beckmann Roughness Limits - Zero variance (optical flat) and asymptotic variance (boulder scarp) stay within valid ranges', () => {
  // Zero variance optical flat
  const flat = calculateBeckmannFromStats(0, 100);
  assert.equal(flat.rmsSlope_s, 0.0);
  assert.equal(flat.roughnessTheta0Deg, 0.0);
  assert.equal(flat.hazardLevel, 'SMOOTH');
  assert.equal(flat.recommendation, 'GO');

  // Extreme micro-roughness (10,000m variance over 1m)
  const scarp = calculateBeckmannFromStats(10000, 1.0);
  assert.ok(scarp.rmsSlope_s > 1000);
  assert.ok(scarp.roughnessTheta0Deg >= 89.0 && scarp.roughnessTheta0Deg <= 90.0);
  assert.equal(scarp.hazardLevel, 'HAZARDOUS');
  assert.equal(scarp.recommendation, 'ABORT');

  // Single elevation sample and identical elevations array
  const single = calculateBeckmannFromElevations([1500], 50);
  assert.equal(single.rmsSlope_s, 0.0);
  const identical = calculateBeckmannFromElevations([2000, 2000, 2000, 2000], 25);
  assert.equal(identical.rmsSlope_s, 0.0);

  // Zero correlation length clamps safely
  const clampedL = calculateBeckmannFromStats(5.0, 0);
  assert.ok(Number.isFinite(clampedL.rmsSlope_s));
});

test('Tier 5 [ADV-4]: Telecom Link Budget Boundaries - Near-zero DSN margin transition at exactly 3.00 dB and micro-power limits', () => {
  // Micro-power 0.00001W clamps to 0.1W without -Infinity
  const microPower = calculateRfLinkBudget({
    earthDistanceKm: 384400,
    earthElevationDeg: 10.0,
    isTerrainObstructed: false,
    band: 'xBandDownlink',
    transmitterPowerWatts: 0.00001,
    dataRateMbps: 2.0,
  });
  assert.ok(Number.isFinite(microPower.eirpDbw));
  assert.ok(Number.isFinite(microPower.receivedPowerDbm));

  // Zero data rate clamps to 1000 bps
  const zeroDataRate = calculateRfLinkBudget({
    earthDistanceKm: 384400,
    earthElevationDeg: 10.0,
    isTerrainObstructed: false,
    band: 'xBandDownlink',
    transmitterPowerWatts: 15,
    dataRateMbps: 0,
  });
  assert.ok(Number.isFinite(zeroDataRate.carrierToNoiseDensityDbHz));

  // Grazing elevation boundary at 2.0° vs 1.99°
  const nonGrazing = calculateRfLinkBudget({
    earthDistanceKm: 384400,
    earthElevationDeg: 2.0,
    isTerrainObstructed: false,
    band: 'xBandDownlink',
    transmitterPowerWatts: 15,
    dataRateMbps: 2.0,
  });
  assert.equal(nonGrazing.multipathWarning, false);

  const grazing = calculateRfLinkBudget({
    earthDistanceKm: 384400,
    earthElevationDeg: 1.99,
    isTerrainObstructed: false,
    band: 'xBandDownlink',
    transmitterPowerWatts: 15,
    dataRateMbps: 2.0,
  });
  assert.equal(grazing.multipathWarning, true);
  assert.ok(nonGrazing.linkMarginDb - grazing.linkMarginDb >= 2.4);

  // Sub-horizon triggers loss_of_signal and -Infinity margin
  const subHorizon = calculateRfLinkBudget({
    earthDistanceKm: 384400,
    earthElevationDeg: 0.0,
    isTerrainObstructed: false,
    band: 'xBandDownlink',
    transmitterPowerWatts: 15,
    dataRateMbps: 2.0,
  });
  assert.equal(subHorizon.linkState, 'loss_of_signal');
  assert.equal(subHorizon.linkMarginDb, -Infinity);
});

test('Tier 5 [ADV-5]: Deep Space Distance Extremes - Planetary range extremes (perigee 356,500 km to apogee 406,700 km) and zero-distance guard', () => {
  // Zero distance returns 0 dB without exception
  assert.equal(calculateFreeSpacePathLoss(0, 8.45), 0);
  assert.equal(calculateFreeSpacePathLoss(-100, 8.45), 0);

  // Monotonicity of FSPL across Moon orbit
  const perigee = calculateFreeSpacePathLoss(356500, 8.45);
  const nominal = calculateFreeSpacePathLoss(384400, 8.45);
  const apogee = calculateFreeSpacePathLoss(406700, 8.45);

  assert.ok(perigee < nominal);
  assert.ok(nominal < apogee);
  assert.ok(apogee - perigee > 1.1 && apogee - perigee < 1.2);
});

// ============================================================================
// Suite 2: High-Frequency Concurrent State Mutations & Temporal Scrubbing
// ============================================================================

test('Tier 5 [ADV-6]: Concurrent State Mutations - High-frequency burst of 100 alternating scenario actions maintains state consistency and referential purity', () => {
  let state = createInitialScenarioState();
  const siteIds = CANDIDATE_SITES.map((s) => s.id);

  // Rapid dispatch of 100 alternating actions
  for (let i = 0; i < 100; i++) {
    const siteId = siteIds[i % siteIds.length];
    state = scenarioReducer(state, { type: 'site/selected', siteId });
    state = scenarioReducer(state, { type: 'epoch/changed', epochMs: 1792584000000 + i * 3600000 });
  }

  assert.ok(siteIds.includes(state.selectedSiteId));
  assert.equal(state.epochMs, 1792584000000 + 99 * 3600000);

  // Idempotence & referential equality
  const sameSite = scenarioReducer(state, { type: 'site/selected', siteId: state.selectedSiteId });
  assert.equal(sameSite, state, 'Same site action returns exact state reference');

  // Invalid site ID leaves state untouched
  const invalidSite = scenarioReducer(state, { type: 'site/selected', siteId: 'invalid-site-id-999' });
  assert.equal(invalidSite, state);
});

test('Tier 5 [ADV-7]: Century-Spanning Temporal Scrubbing - Ephemeris vectors from Apollo 11 (1969) to Year 2100 remain within physical libration envelopes', () => {
  const epochs = [
    { label: 'Apollo 11 (1969)', epochMs: -14159040000, jd: 2440423.345 },
    { label: 'Artemis III (2026)', epochMs: 1792584000000, jd: 2461335.0 },
    { label: 'Year 2100', epochMs: 4102444800000, jd: 2488070.5 },
  ];

  for (const item of epochs) {
    const ephem = calculateLunarEphemeris(item.jd);
    assert.ok(Math.abs(ephem.subSolarLatDeg) <= 1.6, `${item.label} sub-solar lat out of bounds`);
    assert.ok(ephem.subSolarLonDeg >= 0 && ephem.subSolarLonDeg <= 360, `${item.label} sub-solar lon out of bounds`);
    assert.ok(Math.abs(ephem.subEarthLatDeg) <= 7.0, `${item.label} sub-Earth lat out of bounds`);
    assert.ok(Math.abs(ephem.subEarthLonDeg) <= 8.5, `${item.label} sub-Earth lon out of bounds`);
    assert.ok(ephem.earthMoonDistanceKm >= 356000 && ephem.earthMoonDistanceKm <= 410000);

    // Ensure reducer accepts negative epochMs
    const state = scenarioReducer(createInitialScenarioState(), { type: 'epoch/changed', epochMs: item.epochMs });
    assert.equal(state.epochMs, item.epochMs);
  }
});

test('Tier 5 [ADV-8]: URL Routing Conflict Precedence - Pathname strictly overrides contradictory hash fragments and query parameters', () => {
  // Pathname takes precedence over hash and search
  const tab = resolveTabFromPath('/scenario/3d-lab', '#/compare', '?tab=horizon');
  assert.equal(tab, 'lab');

  // When pathname is empty, hash takes precedence over search
  const tabHash = resolveTabFromPath('', '#/gallery', '?tab=traverse');
  assert.equal(tabHash, 'gallery');

  // When pathname is root and hash empty, search is used
  const tabSearch = resolveTabFromPath('/', '', '?tab=traverse');
  assert.equal(tabSearch, 'traverse');
});

test('Tier 5 [ADV-9]: Malformed Path Traversal & Injection - Path traversal patterns and script injections fall back safely to canonical explore tab', () => {
  assert.equal(resolveTabFromPath('/../../../../etc/passwd', '', ''), 'explore');
  assert.equal(resolveTabFromPath('/<script>alert(1)</script>', '', ''), 'explore');
  assert.equal(resolveTabFromPath('/undefined/null/NaN', '', ''), 'explore');
  assert.equal(resolveTabFromPath('/3d-lab/../../../api', '', ''), 'lab');
  assert.equal(resolvePathFromTab('invalid' as any), '/explore');
});

// ============================================================================
// Suite 3: Offline Network Faults, Cache Eviction & Resiliency
// ============================================================================

test('Tier 5 [ADV-10]: Horizons LRU Cache Eviction - Strict capacity enforcement under high-volume cache churn', () => {
  const cache = new HorizonsLruCache<string>(5, 3600_000);
  for (let i = 0; i < 8; i++) {
    cache.set(`key_${i}`, `val_${i}`);
  }

  assert.equal(cache.size(), 5, 'LRU cache size must not exceed capacity 5');
  assert.equal(cache.get('key_0'), undefined, 'Oldest entry 0 must be evicted');
  assert.equal(cache.get('key_1'), undefined, 'Oldest entry 1 must be evicted');
  assert.equal(cache.get('key_2'), undefined, 'Oldest entry 2 must be evicted');
  assert.equal(cache.get('key_7'), 'val_7');
});

test('Tier 5 [ADV-11]: Horizons Ephemeris Offline Resilience - Simulated network timeout triggers analytical DE421 fallback with verified metadata', async () => {
  horizonsProxyService.getCache().clear();
  const epoch = Date.UTC(2029, 3, 12, 6, 0, 0);
  // 1ms timeout forces fetch abort
  const ephem = await horizonsProxyService.getHorizonsEphemeris(epoch, 1);
  assert.ok(ephem);
  assert.equal(ephem.status, 'offline-analytical');
  assert.ok(ephem.source.includes('DE421'));
  assert.ok(Number.isFinite(ephem.earthMoonDistanceKm));
  assert.ok(Number.isFinite(ephem.subSolarLatDeg));

  // Repeated request served from cache
  const cached = await horizonsProxyService.getHorizonsEphemeris(epoch, 1);
  assert.equal(cached.status, 'offline-analytical');
});

test('Tier 5 [ADV-12]: NASA Media Proxy Cache Saturation & Adversarial Search - Resists regex injection and limits cache size', () => {
  const cache = new MediaLruCache<any>(3, 3600_000);
  for (let i = 0; i < 5; i++) {
    cache.set(`query_${i}`, { hits: i });
  }
  assert.equal(cache.size(), 3);
  assert.equal(cache.get('query_0'), undefined);

  // Search with empty query returns full catalog
  const emptyRes = (nasaMediaProxyService as any).fallbackSearch('');
  assert.ok(emptyRes.totalHits > 0);

  // Search with regex meta characters must not crash
  const regexRes = (nasaMediaProxyService as any).fallbackSearch('/(?<=\\d).*/');
  assert.equal(regexRes.totalHits, 0);

  // Non-existent asset ID returns fallback item pointing to ~orig.jpg
  const asset = (nasaMediaProxyService as any).fallbackAsset('NON_EXISTENT_9999');
  assert.ok(asset.collection.items.length >= 1);
  assert.ok(asset.collection.items[0].href.includes('NON_EXISTENT_9999'));
});

test('Tier 5 [ADV-13]: NextRush Backend Adversarial Payload Rejection - HTTP 400 with structured Zod errors on out-of-range payloads', async () => {
  const handler = createTestServerHandler();

  // Slope exceeds max 90°
  const res1 = await dispatchServerJson(handler, '/api/landing-safety/evaluate', 'POST', {
    slopeDeg: 95.0,
    illuminationPct: 50.0,
    earthVisibilityPct: 50.0,
    volatilesScore: 50.0,
    roughnessTheta0Deg: 10.0,
  });
  assert.equal(res1.status, 400);

  // Latitude outside South Pole zone (lat > -80°)
  const res2 = await dispatchServerJson(handler, '/api/terrain/slope-roughness', 'POST', {
    latDeg: -70.0,
    lonDeg: 0.0,
  });
  assert.equal(res2.status, 400);
});

test('Tier 5 [ADV-14]: NextRush Backend Extreme Boundary Acceptance - Valid edge payloads compute correct safety and terrain assessments', async () => {
  const handler = createTestServerHandler();

  const safetyRes = await dispatchServerJson(handler, '/api/landing-safety/evaluate', 'POST', {
    slopeDeg: 85.0,
    illuminationPct: 0.0,
    earthVisibilityPct: 0.0,
    volatilesScore: 100.0,
    roughnessTheta0Deg: 45.0,
  });
  assert.equal(safetyRes.status, 200);
  assert.equal(safetyRes.data.recommendation, 'ABORT');
  assert.equal(safetyRes.data.isTipOverHazard, true);

  const terrainRes = await dispatchServerJson(handler, '/api/terrain/slope-roughness', 'POST', {
    latDeg: -90.0,
    lonDeg: 0.0,
  });
  assert.equal(terrainRes.status, 200);
  assert.ok(Number.isFinite(terrainRes.data.slopeDeg));
  assert.ok(terrainRes.data.slopeDeg <= 85.0);
});

// ============================================================================
// Suite 4: Touch Gestures & Gesture Isolation Under Adversarial Input
// ============================================================================

test('Tier 5 [ADV-15]: Touch Pan Clamping & Viewport Bounds - Extreme adversarial drag coordinates and degenerate viewport parameters clamp strictly within finite limits', () => {
  // Degenerate inputs (negative zoom, non-positive container dimensions, NaN) safely fall back
  const sensDegenerate = calculate2DPanSensitivity(-2.5, -100, 600);
  assert.equal(sensDegenerate.effectiveZoom, 1.0, 'Negative zoom safely defaults to 1.0');
  assert.equal(sensDegenerate.screenPixelPerSvgUnit, 1.0, 'Degenerate width defaults to svgSize');
  assert.equal(sensDegenerate.svgUnitPerScreenPixel, 1.0);

  // Invariant: screenPixelPerSvgUnit and svgUnitPerScreenPixel are reciprocal inverses
  const sensNormal = calculate2DPanSensitivity(2.0, 1200, 600);
  assert.ok(Math.abs(sensNormal.screenPixelPerSvgUnit * sensNormal.svgUnitPerScreenPixel - 1.0) < 1e-9);

  // Massive adversarial touch jump (+100,000px, -80,000px) clamps strictly to viewport extent
  const delta = computeZoomAwarePan({ x: 200, y: 200 }, 100000, -80000, 2.0, 800, 600);
  const clamped = clampPan({ x: delta.x, y: delta.y }, 2.0, 300);
  const expectedMaxPan = Math.max(160, 300 * 2.0 * 0.75); // 450px
  assert.equal(clamped.x, expectedMaxPan, 'Extreme positive pan delta must clamp to maxPan');
  assert.equal(clamped.y, -expectedMaxPan, 'Extreme negative pan delta must clamp to -maxPan');
});

test('Tier 5 [ADV-16]: Dynamic Gesture Transition & Focal Zoom - Multi-touch focal zoom invariance around center and boundary pan dampening', () => {
  const initialViewport = { zoom: 1.0, pan: { x: 0, y: 0 } };

  // Optical center invariance: zooming around canvas center produces zero pan drift
  const centerZoomed = zoomAroundScreenPoint(initialViewport, 2.5, { x: 300, y: 300 }, 300);
  assert.equal(centerZoomed.zoom, 2.5);
  assert.equal(centerZoomed.pan.x, 0, 'Optical center zoom must maintain zero X pan drift');
  assert.equal(centerZoomed.pan.y, 0, 'Optical center zoom must maintain zero Y pan drift');

  // Extreme off-center pinch coordinates clamp pan strictly within allowable viewport bounds
  const cornerZoomed = zoomAroundScreenPoint(initialViewport, 4.0, { x: 2000, y: -1500 }, 300);
  const maxAllowablePan = 300 * 4.0 * 0.75;
  assert.ok(Math.abs(cornerZoomed.pan.x) <= maxAllowablePan, 'Pinch pan X must stay within max allowable pan');
  assert.ok(Math.abs(cornerZoomed.pan.y) <= maxAllowablePan, 'Pinch pan Y must stay within max allowable pan');

  // Identity transition: no-op zoom returns identical viewport object reference
  const unchanged = zoomAroundScreenPoint(initialViewport, 1.0, { x: 150, y: 150 }, 300);
  assert.equal(unchanged, initialViewport, 'No-op zoom transition must preserve viewport reference equality');
});

test('Tier 5 [ADV-17]: Multi-Touch Extreme Coordinates - Massive pinch ratios (500x) and micro-ratios (0.0001x) strictly clamp within authentic production bounds [0.8, 4.5]', () => {
  // Massive 500x pinch expansion clamps to production ZOOM_MAX (4.5)
  assert.equal(clampZoom(1.0 * 500.0), ZOOM_MAX, '500x pinch expansion must clamp to ZOOM_MAX (4.5)');

  // Micro pinch collapse (0.0001x) clamps to production ZOOM_MIN (0.8)
  assert.equal(clampZoom(1.0 * 0.0001), ZOOM_MIN, 'Micro pinch collapse must clamp to ZOOM_MIN (0.8)');

  // Negative and infinite zoom inputs clamp safely without NaN
  assert.equal(clampZoom(-100), ZOOM_MIN, 'Negative zoom input must clamp to ZOOM_MIN (0.8)');
  assert.equal(clampZoom(Infinity), ZOOM_MAX, 'Infinite zoom input must clamp to ZOOM_MAX (4.5)');

  // Stepped zoom boundary clamping
  assert.equal(steppedZoom(4.4, 1), ZOOM_MAX, 'Stepping past upper limit clamps to ZOOM_MAX');
  assert.equal(steppedZoom(0.9, -1), ZOOM_MIN, 'Stepping past lower limit clamps to ZOOM_MIN');

  // Wheel zoom saturation: repeated wheel deltas monotonically saturate at limits
  let zoomIn = 1.0;
  for (let i = 0; i < 50; i++) zoomIn = wheelZoom(zoomIn, -100);
  assert.equal(zoomIn, ZOOM_MAX, 'Continuous wheel zoom-in must saturate at ZOOM_MAX (4.5)');

  let zoomOut = 3.0;
  for (let i = 0; i < 50; i++) zoomOut = wheelZoom(zoomOut, 100);
  assert.equal(zoomOut, ZOOM_MIN, 'Continuous wheel zoom-out must saturate at ZOOM_MIN (0.8)');
});

test('Tier 5 [ADV-18]: 3D Orbit Camera Distance Bounds & Zoom-Aware Sensitivity Scaling - Distance constraints protect against surface clipping and singular sensitivities', () => {
  // Authentic production scene bounds from globeScene.ts
  assert.equal(CONTROL_MIN_DISTANCE, 0.015, 'Production CONTROL_MIN_DISTANCE must be 0.015');
  assert.equal(CONTROL_MAX_DISTANCE, 14.0, 'Production CONTROL_MAX_DISTANCE must be 14.0');
  assert.equal(CAMERA_NEAR, 0.001, 'Production CAMERA_NEAR must be 0.001');
  assert.equal(MOON_SCENE_RADIUS, 1.45, 'Production MOON_SCENE_RADIUS must be 1.45');

  // Invariants: finite positive distances and near-plane safety floor
  assert.ok(CONTROL_MIN_DISTANCE > 0, 'CONTROL_MIN_DISTANCE must be strictly positive');
  assert.ok(CONTROL_MAX_DISTANCE > CONTROL_MIN_DISTANCE, 'CONTROL_MAX_DISTANCE must strictly exceed min distance');
  assert.ok(CAMERA_NEAR < CONTROL_MIN_DISTANCE, 'Camera near clipping plane must sit below minimum camera approach');

  // Zoom-aware sensitivity at distance limits: surface scale vs global scale
  const sensMin = calculate3DOrbitSensitivity(CONTROL_MIN_DISTANCE, 900);
  const sensMax = calculate3DOrbitSensitivity(CONTROL_MAX_DISTANCE, 900);

  // Micro-precision invariant at close zoom vs fluid navigation at global scale
  assert.ok(sensMin.rotateSpeed < sensMax.rotateSpeed, 'Surface rotation speed must be lower than global scale');
  assert.ok(sensMin.panSpeed < sensMax.panSpeed, 'Surface pan speed must be lower than global scale');
  assert.ok(sensMin.dampingFactor > sensMax.dampingFactor, 'Surface damping factor must be higher to arrest camera inertia');
  assert.ok(sensMin.rotateSpeed >= DEFAULT_ORBIT_SENSITIVITY_CONFIG.minRotateSpeed);
  assert.ok(sensMax.rotateSpeed <= DEFAULT_ORBIT_SENSITIVITY_CONFIG.maxRotateSpeed);

  // Adversarial camera distance inputs fall back safely to 0.015 floor without NaN
  const sensNeg = calculate3DOrbitSensitivity(-500.0, 900);
  assert.equal(sensNeg.cameraDistance, 0.015, 'Negative distance must fall back to 0.015');
  assert.ok(Number.isFinite(sensNeg.rotateSpeed), 'Rotate speed must remain finite on negative distance');

  const sensNaN = calculate3DOrbitSensitivity(NaN, 0);
  assert.equal(sensNaN.cameraDistance, 0.015, 'NaN distance must fall back to 0.015');
  assert.ok(Number.isFinite(sensNaN.rotateSpeed), 'Rotate speed must remain finite on NaN distance');
});

