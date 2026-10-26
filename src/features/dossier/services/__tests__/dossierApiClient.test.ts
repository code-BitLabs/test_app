import test from 'node:test';
import assert from 'node:assert/strict';
import { requestMissionDossier } from '../dossierApiClient';

const TEST_EPOCH = Date.parse('2026-10-21T12:00:00Z');

test('requestMissionDossier fetches from live NextRush microservice or executes fallback', async () => {
  const payload = {
    targetName: 'Shackleton Connecting Ridge',
    latitudeDeg: -89.44,
    longitudeDeg: 124.5,
    elevationKm: 1.85,
    epochMs: TEST_EPOCH,
  };

  const res = await requestMissionDossier(payload);
  assert.ok(res.dossier);
  assert.equal(res.dossier.site.name, 'Shackleton Connecting Ridge');
  assert.ok(res.markdown.includes('LUNAMISSION EXECUTIVE BRIEFING'));
  assert.ok(res.jsonTelemetry.includes('https://lunamission.spaceapps.nasa.gov/schemas/dossier-v1.json'));
  assert.ok(['nextrush_server', 'local_analytical_fallback'].includes(res.provenance.source));
});

test('requestMissionDossier seamlessly falls back to local synthesis on unreachable port', async () => {
  const payload = {
    targetName: 'Custom Peak 1',
    latitudeDeg: -88.5,
    longitudeDeg: 45.0,
    epochMs: TEST_EPOCH,
  };

  // Point to dead port
  const res = await requestMissionDossier(payload, 'http://127.0.0.1:59999/api');
  assert.ok(res.dossier);
  assert.equal(res.dossier.site.name, 'Custom Peak 1');
  assert.equal(res.provenance.source, 'local_analytical_fallback');
  assert.ok(res.markdown.includes('CUSTOM PEAK 1'));
});
