import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CANDIDATE_SITES,
  ARTEMIS_III_2024_REGION_IDS,
  getFilteredCandidateSites,
  getSiteById,
} from '../catalog';

test('Candidate Sites Catalog: contains all 20 authoritative sites across four tiers', () => {
  assert.equal(CANDIDATE_SITES.length, 20);
  assert.equal(ARTEMIS_III_2024_REGION_IDS.length, 9);
});

test('Candidate Sites Catalog: October 2024 filter returns exactly 9 Artemis III candidate regions', () => {
  const filtered = getFilteredCandidateSites('artemis-iii-2024');
  assert.equal(filtered.length, 9);

  const ids = filtered.map((s) => s.id);
  assert.ok(ids.includes('mons-mouton'), 'Includes Mons Mouton summit');
  assert.ok(ids.includes('mons-mouton-plateau'), 'Includes Mons Mouton Plateau');
  assert.ok(ids.includes('slater-plain'), 'Includes Slater Plain');
  assert.ok(ids.includes('malapert-massif'), 'Includes Malapert Massif');
  assert.ok(ids.includes('peak-near-cabeus-b'), 'Includes Peak near Cabeus B');
});

test('Candidate Sites Catalog: coordinates conform to Selenographic bounds', () => {
  for (const site of CANDIDATE_SITES) {
    assert.ok(
      site.coordinates.latitudeDeg <= 90.0 && site.coordinates.latitudeDeg >= -90.0,
      `${site.name} latitude should be between -90° and +90°`,
    );
    assert.ok(
      site.coordinates.longitudeDeg >= 0 && site.coordinates.longitudeDeg <= 360,
      `${site.name} longitude should be between 0° and 360°`,
    );
    assert.ok(
      Number.isFinite(site.coordinates.elevationMeters),
      `${site.name} elevation should be a valid finite number`,
    );
  }
});

test('Candidate Sites Catalog: getSiteById retrieves valid site', () => {
  const mouton = getSiteById('mons-mouton');
  assert.ok(mouton);
  assert.equal(mouton.code, 'SITE-009');
  assert.equal(mouton.name, 'Mons Mouton');
  assert.equal(mouton.coordinates.elevationMeters, 6120);
});
