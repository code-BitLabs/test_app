import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '@nextrush/adapter-bun';
import { createServerApp } from '@server/app';

const app = createServerApp();
const rawHandler = createHandler(app);
const handler = (req: Request) => (rawHandler as any)(req, {} as any);

test('NextRush Server: GET /api/health returns online status and runtime telemetry', async () => {
  const req = new Request('http://localhost:3001/api/health', { method: 'GET' });
  const res = await handler(req);

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'online');
  assert.equal(data.framework, 'NextRush');
  assert.equal(data.runtime, 'Bun');
  assert.ok(typeof data.epoch === 'string');
});

test('NextRush Server: POST /api/ephemeris/conditions calculates valid lunar conditions', async () => {
  const payload = {
    siteId: 'connecting-ridge',
    epochMs: Date.UTC(2026, 9, 26, 12, 0, 0),
    calculationMode: 'geometry-only',
  };

  const req = new Request('http://localhost:3001/api/ephemeris/conditions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const res = await handler(req);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.equal(data.siteId, 'connecting-ridge');
  assert.ok(data.solarElevationDeg !== undefined);
  assert.ok(data.earthElevationDeg !== undefined);
  assert.ok(data.earthDistanceKm > 350000);
});

test('NextRush Server: POST /api/ephemeris/conditions rejects invalid input with 400 and Zod issues', async () => {
  const req = new Request('http://localhost:3001/api/ephemeris/conditions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ siteId: '', epochMs: 'invalid' }),
  });

  const res = await handler(req);
  assert.equal(res.status, 400);

  const data = await res.json();
  assert.equal(data.error, 'Validation Error');
  assert.ok(Array.isArray(data.issues));
  assert.ok(data.issues.length >= 2);
});

test('NextRush Server: POST /api/telecom/link-budget calculates DSN RF margin', async () => {
  const payload = {
    siteId: 'connecting-ridge',
    epochMs: Date.UTC(2026, 9, 26, 12, 0, 0),
    band: 'xBandDownlink',
    transmitterPowerWatts: 15,
    dataRateMbps: 2.0,
  };

  const req = new Request('http://localhost:3001/api/telecom/link-budget', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const res = await handler(req);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.ok(data.linkBudget !== undefined);
  assert.ok(data.linkBudget.linkMarginDb !== undefined);
  assert.ok(data.dsnTracking !== undefined);
  assert.ok(data.dsnTracking.activeStation !== undefined);
});

test('NextRush Server: POST /api/telecom/link-budget rejects invalid payload with 400', async () => {
  const req = new Request('http://localhost:3001/api/telecom/link-budget', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ siteId: 'connecting-ridge', epochMs: 1793016000000, band: 'invalid-band' }),
  });

  const res = await handler(req);
  assert.equal(res.status, 400);

  const data = await res.json();
  assert.equal(data.error, 'Validation Error');
});

test('NextRush Server: POST /api/traversal/plan computes valid EVA route and slope classification', async () => {
  const payload = {
    originLatDeg: -89.68,
    originLonDeg: 125.0,
    destinationLatDeg: -89.92,
    destinationLonDeg: 110.0,
    maxWaypoints: 20,
  };

  const req = new Request('http://localhost:3001/api/traversal/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const res = await handler(req);
  assert.equal(res.status, 200);

  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(body.data !== undefined);
  assert.ok(body.data.totalDistanceKm > 0);
  assert.ok(body.data.waypoints.length > 5);
  assert.ok(body.data.batteryMarginPct >= 0);
});

test('NextRush Server: POST /api/traversal/plan rejects invalid latitude coordinates with 400', async () => {
  const req = new Request('http://localhost:3001/api/traversal/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originLatDeg: 45.0, // Invalid: not lunar south pole (-90 to -70)
      originLonDeg: 0,
      destinationLatDeg: -89.5,
      destinationLonDeg: 0,
    }),
  });

  const res = await handler(req);
  assert.equal(res.status, 400);

  const data = await res.json();
  assert.equal(data.error, 'Invalid traversal request payload');
  assert.ok(Array.isArray(data.issues));
});

test('NextRush Server: POST /api/volatiles/prospect evaluates hydrogen wt% and Diviner temp', async () => {
  const req = new Request('http://localhost:3001/api/volatiles/prospect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      latDeg: -89.68,
      lonDeg: 125.0,
    }),
  });

  const res = await handler(req);
  assert.equal(res.status, 200);

  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(body.data !== undefined);
  assert.equal(body.data.isPsr, true);
  assert.ok(body.data.divinerTempKelvin < 110);
  assert.ok(body.data.hydrogenWeightPct > 0.1);
  assert.ok(body.data.isruFeasibilityScore > 0);
});

test('NextRush Server: POST /api/volatiles/prospect rejects invalid coordinates with 400', async () => {
  const req = new Request('http://localhost:3001/api/volatiles/prospect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      latDeg: 10.0, // Invalid: outside south pole
      lonDeg: 0,
    }),
  });

  const res = await handler(req);
  assert.equal(res.status, 400);

  const data = await res.json();
  assert.equal(data.error, 'Invalid volatile prospecting payload');
});

test('NextRush Server: handles 404 for unknown endpoints gracefully', async () => {
  const req = new Request('http://localhost:3001/api/unknown-endpoint', { method: 'GET' });
  const res = await handler(req);

  assert.equal(res.status, 404);
});
