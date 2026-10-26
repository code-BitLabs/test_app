import test from 'node:test';
import assert from 'node:assert/strict';
import { synthesizeMissionDossier } from '../missionDossierModel';
import { formatDossierAsMarkdown, formatDossierAsJson } from '../dossierMarkdownFormatter';

const TEST_EPOCH = Date.parse('2026-10-21T12:00:00Z');

test('formatDossierAsMarkdown formats publication-ready aerospace briefing with all sections', () => {
  const dossier = synthesizeMissionDossier({
    targetName: 'Shackleton Connecting Ridge',
    latitudeDeg: -89.44,
    longitudeDeg: 124.5,
    elevationKm: 1.85,
    epochMs: TEST_EPOCH,
    roverDestination: {
      name: 'Shackleton Crater Floor PSR',
      latitudeDeg: -89.9,
      longitudeDeg: 0.0,
    },
  });

  const md = formatDossierAsMarkdown(dossier);

  // Assertions for critical headers & tables
  assert.ok(md.includes('# 🌔 LUNAMISSION EXECUTIVE BRIEFING'));
  assert.ok(md.includes('SHACKLETON CONNECTING RIDGE'));
  assert.ok(md.includes('## 1. Selenographic Geodesy & Reference Frame'));
  assert.ok(md.includes('## 2. Topocentric Illumination & Solar Power'));
  assert.ok(md.includes('## 3. NASA Deep Space Network (DSN) Telecom'));
  assert.ok(md.includes('## 4. Volatiles & ISRU Water-Ice Assessment'));
  assert.ok(md.includes('## 5. Surface Rover Traversal & EVA Corridor'));
  assert.ok(md.includes('## 6. Comparative Benchmark against Artemis Catalog'));
  assert.ok(md.includes('## 7. Scientific Provenance & Ephemeris Engine'));

  // Assertions for specific telemetry tokens
  assert.ok(md.includes('-89.44'));
  assert.ok(md.includes('MOON_ME_DE421'));
  assert.ok(md.includes('Free-Space Path Loss'));
  assert.ok(md.includes('Link Margin'));
  assert.ok(md.includes('Diviner Cryogenic Temp'));
  assert.ok(md.includes('Feasibility Grade'));
});

test('formatDossierAsJson serializes dossier into valid JSON with schema wrapper', () => {
  const dossier = synthesizeMissionDossier({
    targetName: 'Custom Landing Target',
    latitudeDeg: -88.0,
    longitudeDeg: 210.0,
    epochMs: TEST_EPOCH,
  });

  const jsonStr = formatDossierAsJson(dossier);
  const parsed = JSON.parse(jsonStr);

  assert.equal(parsed.schema, 'https://lunamission.spaceapps.nasa.gov/schemas/dossier-v1.json');
  assert.equal(parsed.dossier.site.name, 'Custom Landing Target');
  assert.ok(typeof parsed.dossier.illumination.sunElevationDeg === 'number');
  assert.ok(typeof parsed.dossier.telecom.linkMarginDb === 'number');
});
