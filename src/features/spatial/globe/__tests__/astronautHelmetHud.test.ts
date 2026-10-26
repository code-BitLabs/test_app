import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAstronautHudTelemetry } from '../model/astronautHudModel';

test('Astronaut Helmet HUD: computes authentic xEMU suit telemetry and celestial angles', () => {
  const telemetry = calculateAstronautHudTelemetry({
    siteName: 'Shackleton Ridge',
    latDeg: -89.68,
    lonDeg: 125.0,
    elevationMeters: 4250,
    slopeDeg: 6.5,
    sunElevationDeg: 1.2,
    earthElevationDeg: 4.8,
    missionElapsedSeconds: 3600, // 1 hour into EVA
  });

  assert.equal(telemetry.suitPressurePsia, 4.3);
  assert.equal(telemetry.oxygenMarginPct, 92); // 8% consumed in 1 hour of 12-hour reserve
  assert.equal(telemetry.suitBatteryPct, 88);
  assert.equal(telemetry.evaElapsedFormatted, '01:00:00');
  assert.equal(telemetry.solarHazardState, 'grazing_glare');
  assert.equal(telemetry.dteCommsState, 'dsn_nominal');
  assert.equal(telemetry.terrainHazardState, 'safe');
});

test('Astronaut Helmet HUD: alerts when slope exceeds autonomous safety cutoff (>15 deg)', () => {
  const telemetry = calculateAstronautHudTelemetry({
    siteName: 'Shackleton Crater Wall',
    latDeg: -89.70,
    lonDeg: 120.0,
    elevationMeters: 1200,
    slopeDeg: 28.5,
    sunElevationDeg: -0.5,
    earthElevationDeg: -1.2,
    missionElapsedSeconds: 7200,
  });

  assert.equal(telemetry.terrainHazardState, 'scarp_danger');
  assert.equal(telemetry.solarHazardState, 'shadowed');
  assert.equal(telemetry.dteCommsState, 'occluded');
});
