/**
 * Lander-to-Rover Surface Topographic Line of Sight (LOS)
 *
 * Evaluates whether direct optical and ultra-high frequency (UHF) radio link
 * exists between the lunar lander high mast and the rover transceiver antenna.
 */

import { LanderLineOfSight } from './types';

export const LANDER_ANTENNA_HEIGHT_METERS = 6.0;
export const ROVER_ANTENNA_HEIGHT_METERS = 2.0;

export interface IntermediateElevationPoint {
  distanceMeters: number;
  elevationMeters: number;
}

export function evaluateLineOfSight(
  roverDistanceMeters: number,
  roverElevationMeters: number,
  landerElevationMeters: number,
  interveningPoints: IntermediateElevationPoint[],
): LanderLineOfSight {
  if (roverDistanceMeters <= 50) {
    return 'direct';
  }

  const landerH = landerElevationMeters + LANDER_ANTENNA_HEIGHT_METERS;
  const roverH = roverElevationMeters + ROVER_ANTENNA_HEIGHT_METERS;

  let minClearanceMeters = Infinity;

  for (const pt of interveningPoints) {
    if (pt.distanceMeters <= 10 || pt.distanceMeters >= roverDistanceMeters - 10) {
      continue;
    }

    const t = pt.distanceMeters / roverDistanceMeters;
    // Linear elevation of the sightline ray at distance pt.distanceMeters
    const rayElevation = landerH + t * (roverH - landerH);
    const clearance = rayElevation - pt.elevationMeters;

    if (clearance < minClearanceMeters) {
      minClearanceMeters = clearance;
    }
  }

  if (minClearanceMeters > 1.5) {
    return 'direct';
  } else if (minClearanceMeters >= -0.5) {
    return 'grazing';
  } else {
    return 'occluded';
  }
}
