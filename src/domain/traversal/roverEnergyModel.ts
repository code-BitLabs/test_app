/**
 * Lunar Rover Mobility & Battery Energy Consumption Model
 *
 * Grounded in NASA Apollo Lunar Roving Vehicle (LRV) and VIPER mobility data:
 * - Lunar surface gravity g = 1.62 m/s^2
 * - Regolith Bekker terramechanics rolling resistance
 * - Mechanical climb potential energy
 * - Hotel electronics / avionics baseline load
 */

import { RoverSpecifications } from './types';

export const MOON_GRAVITY_MPS2 = 1.62;
export const REGOLITH_ROLLING_RESISTANCE_COEFF = 0.08;

export interface SegmentEnergyResult {
  durationSeconds: number;
  powerWatts: number;
  energyWattHours: number;
}

export function evaluateRoverEnergySegment(
  distanceMeters: number,
  slopeDeg: number,
  rover: RoverSpecifications,
): SegmentEnergyResult {
  const speedMps = Math.max(0.01, rover.maxSpeedMps);
  const durationSeconds = distanceMeters / speedMps;

  const slopeRad = (slopeDeg * Math.PI) / 180;
  const normalForceN = rover.roverMassKg * MOON_GRAVITY_MPS2 * Math.cos(slopeRad);
  const rollingResistanceN = REGOLITH_ROLLING_RESISTANCE_COEFF * normalForceN;

  // Mechanical work against gravity: positive uphill, negative downhill
  const gravityResistanceN = rover.roverMassKg * MOON_GRAVITY_MPS2 * Math.sin(slopeRad);

  // Mechanical drive power at wheels
  const totalMechanicalForceN = rollingResistanceN + gravityResistanceN;

  let wheelPowerWatts = 0;
  if (totalMechanicalForceN > 0) {
    wheelPowerWatts = (totalMechanicalForceN * speedMps) / rover.motorEfficiency;
  } else {
    // Controlled braking / regenerative coasting
    wheelPowerWatts = Math.max(-25, (totalMechanicalForceN * speedMps) * 0.15);
  }

  // Total electrical power = Base hotel power (avionics/heating) + mechanical wheel power
  const totalPowerWatts = Math.max(40, rover.basePowerWatts + wheelPowerWatts);
  const energyWattHours = (totalPowerWatts * durationSeconds) / 3600.0;

  return {
    durationSeconds,
    powerWatts: totalPowerWatts,
    energyWattHours,
  };
}
