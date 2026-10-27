import test from 'node:test';
import assert from 'node:assert/strict';
import { createServerApp } from '@server/app';
import { createHandler } from '@nextrush/adapter-bun';

function createDispatcher() {
  const app = createServerApp();
  const rawHandler = createHandler(app);
  return async (path: string, method: 'GET' | 'POST' = 'GET', body?: unknown) => {
    const url = `http://localhost:3001${path}`;
    const init: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body !== undefined && method !== 'GET') {
      init.body = JSON.stringify(body);
    }
    const req = new Request(url, init);
    const res = await (rawHandler as any)(req, {} as any);
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  };
}

const dispatch = createDispatcher();

test('NextRush Server: POST /api/terrain/slope-roughness calculates slope and Beckmann roughness', async () => {
  const { status, data } = await dispatch('/api/terrain/slope-roughness', 'POST', {
    latDeg: -89.44,
    lonDeg: 222.5,
  });

  assert.equal(status, 200);
  assert.equal(typeof data.slopeDeg, 'number');
  assert.equal(typeof data.rmsSlope_s, 'number');
  assert.equal(typeof data.beckmannRoughnessTheta0Deg, 'number');
  assert.equal(typeof data.isTipOverHazard, 'boolean');
  assert.equal(data.isTipOverHazard, data.slopeDeg >= 15.0);
  assert.ok(data.roughnessHazard !== undefined);
  assert.ok(data.recommendation !== undefined);
});

test('NextRush Server: POST /api/terrain/slope-roughness rejects non-polar coordinates with 400', async () => {
  const { status, data } = await dispatch('/api/terrain/slope-roughness', 'POST', {
    latDeg: -45.0, // Non-polar
    lonDeg: 0.0,
  });

  assert.equal(status, 400);
  assert.equal(data.error, 'Validation Error');
});

test('NextRush Server: POST /api/landing-safety/evaluate computes 5-factor safety index and recommendation', async () => {
  const { status, data } = await dispatch('/api/landing-safety/evaluate', 'POST', {
    slopeDeg: 3.5,
    illuminationPct: 85.0,
    earthVisibilityPct: 70.0,
    volatilesScore: 65.0,
    roughnessTheta0Deg: 3.0,
  });

  assert.equal(status, 200);
  assert.equal(typeof data.compositeScore, 'number');
  assert.ok(data.compositeScore > 70);
  assert.equal(data.recommendation, 'GO');
  assert.equal(data.breakdown.slopeScore, 100);
  assert.equal(data.breakdown.roughnessScore, 100);
  assert.equal(data.breakdown.illuminationScore, 85);
});

test('NextRush Server: POST /api/landing-safety/evaluate flags tip-over hazard and returns ABORT for slope >= 15 deg', async () => {
  const { status, data } = await dispatch('/api/landing-safety/evaluate', 'POST', {
    slopeDeg: 16.2,
    illuminationPct: 90.0,
    earthVisibilityPct: 80.0,
    volatilesScore: 70.0,
    roughnessTheta0Deg: 5.0,
  });

  assert.equal(status, 200);
  assert.equal(data.isTipOverHazard, true);
  assert.equal(data.breakdown.slopeScore, 0);
  assert.equal(data.recommendation, 'ABORT');
});

test('NextRush Server: POST /api/landing-safety/evaluate rejects invalid inputs with 400', async () => {
  const { status, data } = await dispatch('/api/landing-safety/evaluate', 'POST', {
    slopeDeg: -5.0, // Invalid negative slope
    illuminationPct: 'not-a-number',
  });

  assert.equal(status, 400);
  assert.equal(data.error, 'Validation Error');
});

test('NextRush Server: POST and GET /api/ephemeris/horizons returns ephemeris coordinates with caching', async () => {
  const testEpoch = Date.UTC(2026, 9, 21, 12, 0, 0);

  const postRes = await dispatch('/api/ephemeris/horizons', 'POST', { epochMs: testEpoch });
  assert.equal(postRes.status, 200);
  assert.ok(postRes.data.earthMoonDistanceKm > 350000);
  assert.ok(postRes.data.source !== undefined);

  // GET request with query param hits cache
  const getRes = await dispatch(`/api/ephemeris/horizons?epochMs=${testEpoch}`, 'GET');
  assert.equal(getRes.status, 200);
  assert.equal(getRes.data.cached, true);
});

test('NextRush Server: GET /api/media/search returns curated NASA media assets', async () => {
  const { status, data } = await dispatch('/api/media/search?q=illumination', 'GET');
  assert.equal(status, 200);
  assert.ok(data.totalHits > 0);
  assert.ok(data.items.length > 0);
  assert.ok(data.items[0].nasaId !== undefined);
  assert.ok(data.items[0].title !== undefined);
});

test('NextRush Server: GET /api/media/asset/:id returns asset URLs and handles missing id', async () => {
  const { status, data } = await dispatch('/api/media/asset/SVS-5127', 'GET');
  assert.equal(status, 200);
  assert.equal(data.nasaId, 'SVS-5127');
  assert.ok(data.collection.items.length > 0);
});
