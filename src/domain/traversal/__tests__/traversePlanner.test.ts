import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTraversalPlan, evaluateRoverEnergySegment } from '../traversePlanner';
import { PRESET_LUNAR_TRAVERSES } from '../presetRoutes';
import { RoverSpecifications } from '../types';

const defaultRover: RoverSpecifications = {
  roverMassKg: 450, // VIPER-class mass
  maxSpeedMps: 0.1, // 10 cm/s nominal speed (0.36 km/h)
  basePowerWatts: 120, // Avionics, thermal loop, instruments
  motorEfficiency: 0.75,
  batteryCapacityWh: 1200,
  maxTraversableSlopeDeg: 15.0, // Scarp cutoff
};

test('Rover Traversal: evaluates rover energy segment accurately on flat vs uphill gradients', () => {
  const flatEnergy = evaluateRoverEnergySegment(
    100, // 100 meters
    0.0, // 0 deg slope
    defaultRover,
  );
  assert.ok(Math.abs(flatEnergy.durationSeconds - 1000) < 1);
  assert.ok(flatEnergy.energyWattHours > 32);
  assert.ok(flatEnergy.energyWattHours < 38);

  // 10-degree incline requires mechanical climb power
  const uphillEnergy = evaluateRoverEnergySegment(
    100,
    10.0,
    defaultRover,
  );
  assert.ok(uphillEnergy.energyWattHours > flatEnergy.energyWattHours);
});

test('Rover Traversal: flags steep slopes (>15 deg) as hazard and classifies safety levels', () => {
  const shackletonPreset = PRESET_LUNAR_TRAVERSES.find((p) => p.id === 'shackleton-rim-to-floor');
  assert.ok(shackletonPreset !== undefined);

  const plan = calculateTraversalPlan({
    originLatDeg: shackletonPreset!.originLatDeg,
    originLonDeg: shackletonPreset!.originLonDeg,
    destinationLatDeg: shackletonPreset!.destinationLatDeg,
    destinationLonDeg: shackletonPreset!.destinationLonDeg,
    rover: defaultRover,
    maxWaypoints: 25,
  });

  assert.ok(plan.waypoints.length > 5);
  assert.ok(plan.totalDistanceKm > 3.0);
  assert.ok(plan.totalDistanceKm < 25.0);

  // Verify slope classification and statistics
  assert.ok(plan.maxSlopeDeg > 0);
  assert.ok(plan.averageSlopeDeg > 0);
  assert.equal(plan.hazardCount + plan.cautionCount + plan.safeCount, plan.waypoints.length);

  // Line of sight to lander should be tracked
  const sumDistance = plan.lineOfSightSummary.directDistanceKm + plan.lineOfSightSummary.occludedDistanceKm;
  assert.ok(Math.abs(sumDistance - plan.totalDistanceKm) < 0.2);
});

test('Rover Traversal: correctly models Mons Mouton to Shoemaker crater rim traverse', () => {
  const monsMoutonPreset = PRESET_LUNAR_TRAVERSES.find((p) => p.id === 'mons-mouton-to-shoemaker');
  assert.ok(monsMoutonPreset !== undefined);

  const plan = calculateTraversalPlan({
    originLatDeg: monsMoutonPreset!.originLatDeg,
    originLonDeg: monsMoutonPreset!.originLonDeg,
    destinationLatDeg: monsMoutonPreset!.destinationLatDeg,
    destinationLonDeg: monsMoutonPreset!.destinationLonDeg,
    rover: defaultRover,
  });

  assert.ok(plan.estimatedDurationHours > 1);
  assert.ok(plan.totalEnergyWh > 50);
  assert.ok(plan.batteryMarginPct >= 0);
});

test('Rover Traversal: calculates Connecting Ridge to de Gerlache traverse with high direct LOS', () => {
  const connectingRidgePreset = PRESET_LUNAR_TRAVERSES.find((p) => p.id === 'connecting-ridge-to-degerlache');
  assert.ok(connectingRidgePreset !== undefined);

  const plan = calculateTraversalPlan({
    originLatDeg: connectingRidgePreset!.originLatDeg,
    originLonDeg: connectingRidgePreset!.originLonDeg,
    destinationLatDeg: connectingRidgePreset!.destinationLatDeg,
    destinationLonDeg: connectingRidgePreset!.destinationLonDeg,
    rover: defaultRover,
    maxWaypoints: 20,
  });

  assert.ok(plan.waypoints.length >= 10);
  assert.ok(plan.lineOfSightSummary.directDistanceKm > 0);
  assert.equal(plan.waypoints[0].terrainSafety, 'safe');
});

test('Rover Traversal: clamps battery margin to zero when energy exceeds total battery capacity', () => {
  // Ultra-small battery
  const lowBatteryRover: RoverSpecifications = {
    ...defaultRover,
    batteryCapacityWh: 10, // Only 10 Wh
  };

  const plan = calculateTraversalPlan({
    originLatDeg: -89.68,
    originLonDeg: 125.0,
    destinationLatDeg: -89.85,
    destinationLonDeg: 120.0,
    rover: lowBatteryRover,
  });

  assert.equal(plan.batteryMarginPct, 0);
});
