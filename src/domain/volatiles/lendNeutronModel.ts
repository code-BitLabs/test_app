/**
 * NASA LRO LEND (Lunar Exploration Neutron Detector) Model
 *
 * Epithermal neutron suppression correlates with hydrogen mass fraction in lunar regolith.
 * Epithermal neutrons are moderated by hydrogen nuclei: lower flux (cps) indicates higher water equivalent hydrogen (WEH).
 */

import { sampleTerrainAtLatLon } from '@/domain/terrain/lolaSouthPoleDemSampler';

export const DRY_LUNAR_REGOLITH_CPS = 12.8; // Baseline count rate over hydrogen-depleted highlands
export const MIN_LEND_SUPPRESSION_CPS = 6.2; // Maximum suppression inside deep cold traps

export interface LendNeutronData {
  neutronFluxCps: number;
  hydrogenWeightPct: number;
  waterEquivalentHydrogenPct: number;
}

export function evaluateLendNeutronFlux(latDeg: number, lonDeg: number): LendNeutronData {
  const terrain = sampleTerrainAtLatLon(latDeg, lonDeg);

  let neutronFluxCps = DRY_LUNAR_REGOLITH_CPS;
  let hydrogenWeightPct = 0.04; // Baseline solar wind hydrogen in ppm/wt%

  if (terrain.isPermanentlyShadowed) {
    // Cold trap neutron suppression
    // Deep craters exhibit 35% - 50% suppression below regional baseline
    const depthFactor = Math.max(0, Math.min(1, (-terrain.elevationMeters) / 4200));
    neutronFluxCps = Math.round((MIN_LEND_SUPPRESSION_CPS + (1 - depthFactor) * 2.8) * 10) / 10;

    // Hydrogen weight percentage: up to 0.45% - 0.55% in core PSR
    hydrogenWeightPct = Math.round((0.22 + depthFactor * 0.28) * 100) / 100;
  } else {
    // Subtle polar enhancement due to cold regolith trapping
    const polarDistDeg = 90.0 - Math.abs(latDeg);
    const enhancement = Math.max(0, (7.0 - polarDistDeg) * 0.015);
    hydrogenWeightPct = Math.round((0.04 + enhancement) * 100) / 100;
    neutronFluxCps = Math.round((DRY_LUNAR_REGOLITH_CPS - enhancement * 12.0) * 10) / 10;
  }

  // Water Equivalent Hydrogen: H2O molecular weight (18.015) / 2 * H atomic weight (1.008) = 8.936
  const waterEquivalentHydrogenPct = Math.round(hydrogenWeightPct * 8.936 * 100) / 100;

  return {
    neutronFluxCps,
    hydrogenWeightPct,
    waterEquivalentHydrogenPct,
  };
}
