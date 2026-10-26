/**
 * Surface Rover Traversal & EVA Route Planning Engine
 *
 * Implements geodesic path interpolation, digital elevation modeling,
 * slope hazard classification, energy expenditure modeling, and
 * lander line-of-sight communication clearance.
 */

import { LUNAR_MEAN_RADIUS_KM } from '@/domain/constants/astronomy';
import { sampleTerrainAtLatLon } from '@/domain/terrain/lolaSouthPoleDemSampler';
import { evaluateRoverEnergySegment } from './roverEnergyModel';
import { evaluateLineOfSight, IntermediateElevationPoint } from './lineOfSight';
import {
  RoverSpecifications,
  TraversalPlan,
  TraversalPlanRequest,
  TraversalWaypoint,
} from './types';

export { evaluateRoverEnergySegment } from './roverEnergyModel';

export const DEFAULT_ROVER_SPECS: RoverSpecifications = {
  roverMassKg: 450,
  maxSpeedMps: 0.1, // 0.36 km/h nominal surface speed
  basePowerWatts: 120, // Hotel load
  motorEfficiency: 0.75,
  batteryCapacityWh: 1200,
  maxTraversableSlopeDeg: 15.0,
};

/**
 * Computes great-circle angular distance (radians) between two lunar coordinates.
 */
function greatCircleAngularDistance(
  lat1Deg: number,
  lon1Deg: number,
  lat2Deg: number,
  lon2Deg: number,
): number {
  const phi1 = (lat1Deg * Math.PI) / 180;
  const lam1 = (lon1Deg * Math.PI) / 180;
  const phi2 = (lat2Deg * Math.PI) / 180;
  const lam2 = (lon2Deg * Math.PI) / 180;

  const sinDPhi = Math.sin((phi2 - phi1) / 2);
  const sinDLam = Math.sin((lam2 - lam1) / 2);

  const a = sinDPhi * sinDPhi + Math.cos(phi1) * Math.cos(phi2) * sinDLam * sinDLam;
  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}

/**
 * Interpolates intermediate point along great-circle arc.
 */
function interpolateGeodesicPoint(
  lat1Deg: number,
  lon1Deg: number,
  lat2Deg: number,
  lon2Deg: number,
  f: number,
  angularDistRad: number,
): { latDeg: number; lonDeg: number } {
  if (angularDistRad < 1e-7) {
    return { latDeg: lat1Deg, lonDeg: lon1Deg };
  }

  const phi1 = (lat1Deg * Math.PI) / 180;
  const lam1 = (lon1Deg * Math.PI) / 180;
  const phi2 = (lat2Deg * Math.PI) / 180;
  const lam2 = (lon2Deg * Math.PI) / 180;

  const A = Math.sin((1 - f) * angularDistRad) / Math.sin(angularDistRad);
  const B = Math.sin(f * angularDistRad) / Math.sin(angularDistRad);

  const x = A * Math.cos(phi1) * Math.cos(lam1) + B * Math.cos(phi2) * Math.cos(lam2);
  const y = A * Math.cos(phi1) * Math.sin(lam1) + B * Math.cos(phi2) * Math.sin(lam2);
  const z = A * Math.sin(phi1) + B * Math.sin(phi2);

  const phi = Math.atan2(z, Math.hypot(x, y));
  const lam = Math.atan2(y, x);

  return {
    latDeg: (phi * 180) / Math.PI,
    lonDeg: ((lam * 180) / Math.PI + 360) % 360,
  };
}

export function calculateTraversalPlan(request: TraversalPlanRequest): TraversalPlan {
  const rover = request.rover || DEFAULT_ROVER_SPECS;
  const numSteps = Math.max(10, Math.min(80, request.maxWaypoints || 40));

  const totalAngularDist = greatCircleAngularDistance(
    request.originLatDeg,
    request.originLonDeg,
    request.destinationLatDeg,
    request.destinationLonDeg,
  );

  const totalGroundDistanceMeters = totalAngularDist * LUNAR_MEAN_RADIUS_KM * 1000;
  const stepDistanceMeters = totalGroundDistanceMeters / numSteps;

  const waypoints: TraversalWaypoint[] = [];
  const intermediatePoints: IntermediateElevationPoint[] = [];

  let cumulativeEnergyWh = 0;
  let totalDurationSeconds = 0;
  let prevElevation = 0;

  for (let i = 0; i <= numSteps; i++) {
    const f = i / numSteps;
    const { latDeg, lonDeg } = interpolateGeodesicPoint(
      request.originLatDeg,
      request.originLonDeg,
      request.destinationLatDeg,
      request.destinationLonDeg,
      f,
      totalAngularDist,
    );

    const terrain = sampleTerrainAtLatLon(latDeg, lonDeg);
    const distanceFromStartKm = (i * stepDistanceMeters) / 1000.0;

    let segmentSlopeDeg = 0;
    let stepEnergyWh = 0;
    let stepDurationSec = 0;

    if (i === 0) {
      prevElevation = terrain.elevationMeters;
    } else {
      const elevDiff = terrain.elevationMeters - prevElevation;
      segmentSlopeDeg = (Math.atan2(elevDiff, stepDistanceMeters) * 180) / Math.PI;

      const energyResult = evaluateRoverEnergySegment(
        stepDistanceMeters,
        segmentSlopeDeg,
        rover,
      );
      stepEnergyWh = energyResult.energyWattHours;
      stepDurationSec = energyResult.durationSeconds;

      cumulativeEnergyWh += stepEnergyWh;
      totalDurationSeconds += stepDurationSec;
      prevElevation = terrain.elevationMeters;
    }

    intermediatePoints.push({
      distanceMeters: distanceFromStartKm * 1000,
      elevationMeters: terrain.elevationMeters,
    });

    const los = evaluateLineOfSight(
      distanceFromStartKm * 1000,
      terrain.elevationMeters,
      waypoints.length > 0 ? waypoints[0].elevationMeters : terrain.elevationMeters,
      intermediatePoints,
    );

    const effectiveSlope = Math.max(terrain.slopeDeg, Math.abs(segmentSlopeDeg));
    const terrainSafety =
      effectiveSlope > rover.maxTraversableSlopeDeg
        ? 'hazard'
        : effectiveSlope >= 10.0
        ? 'caution'
        : 'safe';

    waypoints.push({
      index: i,
      latDeg: Math.round(latDeg * 10000) / 10000,
      lonDeg: Math.round(lonDeg * 10000) / 10000,
      elevationMeters: Math.round(terrain.elevationMeters),
      slopeDeg: Math.round(terrain.slopeDeg * 10) / 10,
      distanceFromStartKm: Math.round(distanceFromStartKm * 100) / 100,
      segmentSlopeDeg: Math.round(segmentSlopeDeg * 10) / 10,
      stepDistanceMeters: Math.round(i === 0 ? 0 : stepDistanceMeters),
      durationSeconds: Math.round(stepDurationSec),
      energyExpenditureWh: Math.round(stepEnergyWh * 10) / 10,
      cumulativeEnergyWh: Math.round(cumulativeEnergyWh * 10) / 10,
      lineOfSightToLander: los,
      terrainSafety,
      isPsrColdTrap: terrain.isPermanentlyShadowed,
    });
  }

  // Summary Metrics
  const totalDistanceKm = Math.round((totalGroundDistanceMeters / 1000.0) * 100) / 100;
  const estimatedDurationHours = Math.round((totalDurationSeconds / 3600.0) * 10) / 10;
  const totalEnergyWh = Math.round(cumulativeEnergyWh * 10) / 10;

  const batteryRemainingWh = rover.batteryCapacityWh - totalEnergyWh;
  const batteryMarginPct = Math.max(0, Math.round((batteryRemainingWh / rover.batteryCapacityWh) * 100));

  let maxSlopeDeg = 0;
  let slopeSum = 0;
  let safeCount = 0;
  let cautionCount = 0;
  let hazardCount = 0;
  let directSteps = 0;

  for (const wp of waypoints) {
    if (wp.slopeDeg > maxSlopeDeg) maxSlopeDeg = wp.slopeDeg;
    slopeSum += wp.slopeDeg;
    if (wp.terrainSafety === 'safe') safeCount++;
    else if (wp.terrainSafety === 'caution') cautionCount++;
    else hazardCount++;

    if (wp.lineOfSightToLander === 'direct') directSteps++;
  }

  const averageSlopeDeg = Math.round((slopeSum / waypoints.length) * 10) / 10;
  const safePercentage = Math.round((safeCount / waypoints.length) * 100);

  const directDistanceKm = Math.round((directSteps / waypoints.length) * totalDistanceKm * 100) / 100;
  const occludedDistanceKm = Math.round((totalDistanceKm - directDistanceKm) * 100) / 100;
  const directPct = Math.round((directSteps / waypoints.length) * 100);

  return {
    origin: {
      latDeg: waypoints[0].latDeg,
      lonDeg: waypoints[0].lonDeg,
      elevationMeters: waypoints[0].elevationMeters,
    },
    destination: {
      latDeg: waypoints[waypoints.length - 1].latDeg,
      lonDeg: waypoints[waypoints.length - 1].lonDeg,
      elevationMeters: waypoints[waypoints.length - 1].elevationMeters,
    },
    waypoints,
    totalDistanceKm,
    estimatedDurationHours,
    totalEnergyWh,
    batteryMarginPct,
    maxSlopeDeg: Math.round(maxSlopeDeg * 10) / 10,
    averageSlopeDeg,
    safeCount,
    cautionCount,
    hazardCount,
    safePercentage,
    lineOfSightSummary: {
      directDistanceKm,
      occludedDistanceKm,
      directPct,
    },
  };
}
