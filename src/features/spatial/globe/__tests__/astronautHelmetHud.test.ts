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

test('Astronaut Helmet HUD: flags multipath interference when Earth is low above rim (0-2 deg)', () => {
  const telemetry = calculateAstronautHudTelemetry({
    siteName: 'Mons Mouton Plateau',
    latDeg: -84.8,
    lonDeg: 36.2,
    elevationMeters: 5800,
    slopeDeg: 12.0, // caution range 10-15°
    sunElevationDeg: 4.5, // nominal sun >3°
    earthElevationDeg: 1.2, // multipath warning 0-2°
    missionElapsedSeconds: 5400,
  });

  assert.equal(telemetry.dteCommsState, 'multipath_warning');
  assert.equal(telemetry.solarHazardState, 'nominal_sun');
  assert.equal(telemetry.terrainHazardState, 'caution');
});

test('Astronaut Helmet HUD: gracefully clamps depleted oxygen and battery at zero margin', () => {
  const telemetry = calculateAstronautHudTelemetry({
    siteName: 'Emergency Depleted Simulation',
    latDeg: -89.9,
    lonDeg: 0.0,
    elevationMeters: 1000,
    slopeDeg: 5.0,
    sunElevationDeg: 0.5,
    earthElevationDeg: 3.0,
    missionElapsedSeconds: 50000, // >13 hours (exceeds 12h PLSS and 8.5h battery)
  });

  assert.equal(telemetry.oxygenMarginPct, 0);
  assert.equal(telemetry.suitBatteryPct, 0);
  assert.equal(telemetry.evaElapsedFormatted, '13:53:20');
});
