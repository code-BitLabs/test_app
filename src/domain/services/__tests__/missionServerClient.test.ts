import test from 'node:test';
import assert from 'node:assert/strict';
import { missionServerClient } from '../missionServerClient';

test('Mission Server Client: falls back to local domain calculation when backend is unreachable', async () => {
  // Use a non-existent port to force network failure and verify fallback
  const client = missionServerClient.withBaseUrl('http://127.0.0.1:59999/api');

  const result = await client.getConditions({
    siteId: 'connecting-ridge',
    epochMs: Date.UTC(2026, 9, 26, 12, 0, 0),
    calculationMode: 'geometry-only',
  });

  assert.equal(result.siteId, 'connecting-ridge');
  assert.equal(result.source, 'local_analytical_fallback');
  assert.ok(result.solarElevationDeg !== null);
  assert.ok(result.earthElevationDeg !== null);
});

test('Mission Server Client: computes link budget via fallback when backend is unreachable', async () => {
  const client = missionServerClient.withBaseUrl('http://127.0.0.1:59999/api');

  const budget = await client.getLinkBudget({
    siteId: 'connecting-ridge',
    epochMs: Date.UTC(2026, 9, 26, 12, 0, 0),
    band: 'xBandDownlink',
  });

  assert.equal(budget.source, 'local_analytical_fallback');
  assert.equal(budget.linkBudget.linkState, 'locked');
  assert.ok(budget.linkBudget.linkMarginDb > 0);
  assert.ok(budget.dsnTracking.stations.length === 3);
});

test('Mission Server Client: computes traversal plan via fallback when backend is unreachable', async () => {
  const client = missionServerClient.withBaseUrl('http://127.0.0.1:59999/api');

  const plan = await client.getTraversalPlan({
    originLatDeg: -89.68,
    originLonDeg: 125.0,
    destinationLatDeg: -89.92,
    destinationLonDeg: 110.0,
    maxWaypoints: 15,
  });

  assert.equal(plan.source, 'local_analytical_fallback');
  assert.ok(plan.waypoints.length > 5);
  assert.ok(plan.totalDistanceKm > 0);
  assert.ok(plan.batteryMarginPct >= 0);
});

test('Mission Server Client: computes volatile prospect via fallback when backend is unreachable', async () => {
  const client = missionServerClient.withBaseUrl('http://127.0.0.1:59999/api');

  const prospect = await client.getVolatileProspect({
    latDeg: -89.68,
    lonDeg: 125.0,
  });

  assert.equal(prospect.source, 'local_analytical_fallback');
  assert.equal(prospect.isPsr, true);
  assert.ok(prospect.divinerTempKelvin < 110);
  assert.ok(prospect.hydrogenWeightPct > 0.1);
  assert.ok(prospect.isruFeasibilityScore > 0);
});

test('Mission Server Client: optimizes landing windows via fallback when backend is unreachable', async () => {
  const client = missionServerClient.withBaseUrl('http://127.0.0.1:59999/api');

  const result = await client.optimizeLandingWindows({
    siteId: 'connecting-ridge',
    startEpochMs: Date.UTC(2026, 9, 1),
    endEpochMs: Date.UTC(2026, 11, 31),
    stayDurationDays: 14,
    topN: 2,
  });

  assert.equal(result.source, 'local_analytical_fallback');
  assert.equal(result.siteId, 'connecting-ridge');
  assert.ok(result.topWindows.length > 0);
});

test('Mission Server Client: evaluates landing safety via fallback when backend is unreachable', async () => {
  const client = missionServerClient.withBaseUrl('http://127.0.0.1:59999/api');

  const result = await client.evaluateLandingSafety({
    slopeDeg: 3.5,
    illuminationPct: 80.0,
    earthVisibilityPct: 70.0,
    volatilesScore: 60.0,
    roughnessTheta0Deg: 3.0,
  });

  assert.equal(result.source, 'local_analytical_fallback');
  assert.equal(result.recommendation, 'GO');
  assert.ok(result.compositeScore > 70);
  assert.equal(result.breakdown.slopeScore, 100);
});

test('Mission Server Client: calculates terrain slope roughness via fallback when backend is unreachable', async () => {
  const client = missionServerClient.withBaseUrl('http://127.0.0.1:59999/api');

  const result = await client.calculateTerrainRoughness({
    latDeg: -89.44,
    lonDeg: 222.5,
  });

  assert.equal(result.source, 'local_analytical_fallback');
  assert.ok(typeof result.slopeDeg === 'number');
  assert.ok(typeof result.rmsSlope_s === 'number');
  assert.ok(typeof result.beckmannRoughnessTheta0Deg === 'number');
  assert.ok(typeof result.isTipOverHazard === 'boolean');
});

