/**
 * NASA LRO Diviner Lunar Radiometer Thermal Model
 *
 * Models maximum annual surface temperatures across the lunar south pole.
 * In permanent shadows, cryogenic temperatures range from 40K to 95K.
 * Water-ice stability boundary is 110K.
 */

import { sampleTerrainAtLatLon } from '@/domain/terrain/lolaSouthPoleDemSampler';
import { TemperatureCategory, SublimationStability } from './types';

export const WATER_ICE_STABILITY_TEMP_KELVIN = 110.0;

export interface DivinerThermalData {
  tempKelvin: number;
  category: TemperatureCategory;
  stability: SublimationStability;
}

export function evaluateDivinerTemperature(latDeg: number, lonDeg: number): DivinerThermalData {
  const terrain = sampleTerrainAtLatLon(latDeg, lonDeg);
  let tempKelvin = 0;

  if (terrain.isPermanentlyShadowed) {
    // Deep cryogenic PSR floors (Shackleton, Shoemaker, Haworth, Faustini)
    // Scale slightly with elevation depth
    const depthFactor = Math.max(0, Math.min(1, (-terrain.elevationMeters) / 4500));
    tempKelvin = Math.round((45.0 + (1 - depthFactor) * 45.0) * 10) / 10;
  } else {
    // Semi-shadowed or illuminated terrain
    // Base temperature decreases towards the pole
    const polarDistDeg = 90.0 - Math.abs(latDeg);
    const baseTemp = 130.0 + polarDistDeg * 12.0;

    // High elevated massifs in low grazing sun: 180K - 220K
    const elevBoost = Math.max(0, (terrain.elevationMeters / 1000.0) * 8.0);
    tempKelvin = Math.round((baseTemp + elevBoost) * 10) / 10;
  }

  let category: TemperatureCategory;
  let stability: SublimationStability;

  if (tempKelvin < WATER_ICE_STABILITY_TEMP_KELVIN) {
    category = 'cryogenic_cold_trap';
    stability = 'perennially_stable';
  } else if (tempKelvin < 180.0) {
    category = 'sub_freezing_shadow';
    stability = 'geologically_transient';
  } else {
    category = 'illuminated_regolith';
    stability = 'rapidly_sublimating';
  }

  return {
    tempKelvin,
    category,
    stability,
  };
}
