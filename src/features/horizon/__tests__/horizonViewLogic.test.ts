import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTopocentricHorizonRadar } from '@/domain/celestial/horizonProfile';
import { CANDIDATE_SITES } from '@/domain/sites/catalog';
import {
  calculateRfLinkBudget,
  calculateDsnStationVisibilities,
  determineActiveDsnStation,
} from '@/domain/telecom/linkBudget';

test('Topocentric Horizon View: calculates complete radar geometry for Shackleton Rim', () => {
  const site = CANDIDATE_SITES[0];
  const epoch = new Date('2026-10-26T12:00:00Z');

  const radar = generateTopocentricHorizonRadar(site, epoch, 'geometry-only');

  assert.equal(radar.siteId, site.id);
  assert.equal(radar.terrainProfile.length, 73); // 360 / 5 + 1
  assert.ok(radar.sunPath.length >= 28);
  assert.ok(radar.earthLibrationLoop.length >= 26);
  assert.ok(typeof radar.currentSun.elevationDeg === 'number');
  assert.ok(typeof radar.currentEarth.elevationDeg === 'number');
});

test('Topocentric Horizon View: calculates DSN RF link budget and ground tracking', () => {
  const epochMs = Date.UTC(2026, 9, 26, 12, 0, 0);

  const budget = calculateRfLinkBudget({
    earthDistanceKm: 384400,
    earthElevationDeg: 8.5,
    isTerrainObstructed: false,
    band: 'xBandDownlink',
    transmitterPowerWatts: 15,
    dataRateMbps: 2.0,
  });

  assert.equal(budget.linkState, 'locked');
  assert.ok(budget.linkMarginDb > 0);

  const stations = calculateDsnStationVisibilities(epochMs);
  assert.equal(stations.length, 3);

  const active = determineActiveDsnStation(stations);
  assert.ok(active !== null);
  assert.ok(['goldstone', 'madrid', 'canberra'].includes(active.stationId));
});
