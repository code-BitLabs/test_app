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
