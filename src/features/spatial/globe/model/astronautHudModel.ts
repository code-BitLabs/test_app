/**
 * NASA xEMU Astronaut Visor HUD Telemetry Model
 *
 * Implements Extravehicular Mobility Unit life-support calculations,
 * low-sun angle grazing glare detection, and terrain slope safety.
 */

export interface AstronautHudInputs {
  siteName: string;
  latDeg: number;
  lonDeg: number;
  elevationMeters: number;
  slopeDeg: number;
  sunElevationDeg: number;
  earthElevationDeg: number;
  missionElapsedSeconds?: number;
}

export type SolarHazardState = 'grazing_glare' | 'nominal_sun' | 'shadowed';
export type DteCommsState = 'dsn_nominal' | 'multipath_warning' | 'occluded';
export type TerrainHazardState = 'safe' | 'caution' | 'scarp_danger';

export interface AstronautHudTelemetry {
  siteName: string;
  suitPressurePsia: number;
  oxygenMarginPct: number;
  suitBatteryPct: number;
  evaElapsedFormatted: string;
  solarHazardState: SolarHazardState;
  dteCommsState: DteCommsState;
  terrainHazardState: TerrainHazardState;
  latFormatted: string;
  lonFormatted: string;
  elevationFormatted: string;
}

export function calculateAstronautHudTelemetry(
  inputs: AstronautHudInputs,
): AstronautHudTelemetry {
  const elapsedSec = Math.max(0, inputs.missionElapsedSeconds ?? 1800);

  // Formatting HH:MM:SS
  const hrs = Math.floor(elapsedSec / 3600);
  const mins = Math.floor((elapsedSec % 3600) / 60);
  const secs = elapsedSec % 60;
  const evaElapsedFormatted = [
    String(hrs).padStart(2, '0'),
    String(mins).padStart(2, '0'),
    String(secs).padStart(2, '0'),
  ].join(':');

  // PLSS life support model: 12-hour oxygen capacity (8h primary + 4h reserve)
  const totalO2CapacitySec = 12 * 3600;
  const oxygenMarginPct = Math.max(
    0,
    Math.round(((totalO2CapacitySec - elapsedSec) / totalO2CapacitySec) * 100),
  );

  // PLSS battery: 8.5 hour nominal runtime
  const totalBatterySec = 8.5 * 3600;
  const suitBatteryPct = Math.max(
    0,
    Math.round(((totalBatterySec - elapsedSec) / totalBatterySec) * 100),
  );

  // Solar incidence glare
  let solarHazardState: SolarHazardState = 'nominal_sun';
  if (inputs.sunElevationDeg < 0) {
    solarHazardState = 'shadowed';
  } else if (inputs.sunElevationDeg <= 3.0) {
    solarHazardState = 'grazing_glare'; // Low polar grazing glare directly into eyes
  }

  // DTE communications
  let dteCommsState: DteCommsState = 'dsn_nominal';
  if (inputs.earthElevationDeg < 0) {
    dteCommsState = 'occluded';
  } else if (inputs.earthElevationDeg <= 2.0) {
    dteCommsState = 'multipath_warning';
  }

  // Terrain slope hazard
  let terrainHazardState: TerrainHazardState = 'safe';
  if (inputs.slopeDeg > 15.0) {
    terrainHazardState = 'scarp_danger';
  } else if (inputs.slopeDeg >= 10.0) {
    terrainHazardState = 'caution';
  }

  return {
    siteName: inputs.siteName,
    suitPressurePsia: 4.3, // Authentic NASA 100% O2 suit pressure
    oxygenMarginPct,
    suitBatteryPct,
    evaElapsedFormatted,
    solarHazardState,
    dteCommsState,
    terrainHazardState,
    latFormatted: `${Math.abs(inputs.latDeg).toFixed(2)}°S`,
    lonFormatted: `${inputs.lonDeg.toFixed(2)}°E`,
    elevationFormatted: `${inputs.elevationMeters >= 0 ? '+' : ''}${Math.round(inputs.elevationMeters)}m`,
  };
}
