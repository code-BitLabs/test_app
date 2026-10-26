import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '@nextrush/adapter-bun';
import { createServerApp } from '@server/app';

const app = createServerApp();
const rawHandler = createHandler(app);
const handler = (req: Request) => (rawHandler as any)(req, {} as any);

test('NextRush Server: POST /api/dossier/generate returns complete dossier package with markdown', async () => {
  const payload = {
    targetName: 'Shackleton Connecting Ridge',
    latitudeDeg: -89.44,
    longitudeDeg: 124.5,
    elevationKm: 1.85,
    epochMs: Date.UTC(2026, 9, 26, 12, 0, 0),
    telecomBand: 'xBandDownlink',
  };

  const req = new Request('http://localhost:3001/api/dossier/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const res = await handler(req);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.ok(data.dossier);
  assert.equal(data.dossier.site.name, 'Shackleton Connecting Ridge');
  assert.ok(data.markdown);
  assert.ok(data.markdown.includes('# 🌔 LUNAMISSION EXECUTIVE BRIEFING'));
  assert.ok(data.jsonTelemetry);
  assert.ok(data.provenance);
  assert.equal(data.provenance.generator, 'NextRush Backend Calculation Service');
});

test('NextRush Server: POST /api/dossier/generate rejects non-polar coordinates with 400', async () => {
  const req = new Request('http://localhost:3001/api/dossier/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetName: 'Equator Site',
      latitudeDeg: 0.0,
      longitudeDeg: 45.0,
      epochMs: Date.UTC(2026, 9, 26, 12, 0, 0),
    }),
  });

  const res = await handler(req);
  assert.equal(res.status, 400);

  const data = await res.json();
  assert.equal(data.error, 'Validation Error');
  assert.ok(Array.isArray(data.issues));
});

test('NextRush Server: POST /api/dossier/generate rejects missing required fields with 400', async () => {
  const req = new Request('http://localhost:3001/api/dossier/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      latitudeDeg: -88.0,
    }),
  });

  const res = await handler(req);
  assert.equal(res.status, 400);
});
