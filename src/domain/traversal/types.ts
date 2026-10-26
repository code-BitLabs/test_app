/**
 * Surface Rover Traversal & EVA Route Planning Types
 *
 * Defines models for lunar mobility, slope hazard classifications,
 * power & battery consumption, and line-of-sight communication tracking.
 */

export type TerrainSafetyRating = 'safe' | 'caution' | 'hazard';
export type LanderLineOfSight = 'direct' | 'grazing' | 'occluded';

export interface RoverSpecifications {
  roverMassKg: number;
  maxSpeedMps: number;
  basePowerWatts: number;
  motorEfficiency: number;
  batteryCapacityWh: number;
  maxTraversableSlopeDeg: number;
}

export interface TraversalWaypoint {
  index: number;
  latDeg: number;
  lonDeg: number;
  elevationMeters: number;
  slopeDeg: number;
  distanceFromStartKm: number;
  segmentSlopeDeg: number;
  stepDistanceMeters: number;
  durationSeconds: number;
  energyExpenditureWh: number;
  cumulativeEnergyWh: number;
  lineOfSightToLander: LanderLineOfSight;
  terrainSafety: TerrainSafetyRating;
  isPsrColdTrap: boolean;
}

export interface TraversalPlanRequest {
  originLatDeg: number;
  originLonDeg: number;
  destinationLatDeg: number;
  destinationLonDeg: number;
  rover?: RoverSpecifications;
  maxWaypoints?: number;
}

export interface TraversalPlan {
  origin: { latDeg: number; lonDeg: number; elevationMeters: number };
  destination: { latDeg: number; lonDeg: number; elevationMeters: number };
  waypoints: TraversalWaypoint[];
  totalDistanceKm: number;
  estimatedDurationHours: number;
  totalEnergyWh: number;
  batteryMarginPct: number;
  maxSlopeDeg: number;
  averageSlopeDeg: number;
  safeCount: number;
  cautionCount: number;
  hazardCount: number;
  safePercentage: number;
  lineOfSightSummary: {
    directDistanceKm: number;
    occludedDistanceKm: number;
    directPct: number;
  };
}

export interface PresetLunarTraverse {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  originName: string;
  originLatDeg: number;
  originLonDeg: number;
  destinationName: string;
  destinationLatDeg: number;
  destinationLonDeg: number;
  scientificGoal: string;
}
