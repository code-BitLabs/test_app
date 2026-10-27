import { CandidateSite } from '@/domain/sites/candidateSite';
import { getScientificSiteInvestigation } from '@/domain/sites/scientificSiteData';

export interface AxisMetric {
  key: string;
  label: string;
  getValue: (site: CandidateSite) => number; // 0 to 100
}

export const AXIS_METRICS: AxisMetric[] = [
  {
    key: 'solar',
    label: 'Solar Power',
    getValue: (site) => {
      const inv = getScientificSiteInvestigation(site.id);
      return Math.min(100, Math.max(10, inv?.illuminationThermal.annualSolarExposurePercentage ?? 75));
    },
  },
  {
    key: 'battery',
    label: 'Battery Endurance',
    getValue: (site) => {
      const inv = getScientificSiteInvestigation(site.id);
      const maxDarkHours = inv?.illuminationThermal.maxContinuousDarknessHours ?? 72;
      // 0 dark hours = 100%, 354h (equatorial night) = 15%
      return Math.min(100, Math.max(15, Math.round(100 - (maxDarkHours / 354) * 85)));
    },
  },
  {
    key: 'dte',
    label: 'DTE Comm',
    getValue: (site) => {
      const inv = getScientificSiteInvestigation(site.id);
      return Math.min(100, Math.max(0, inv?.missionConstraints.directToEarthVisibilityPercentage ?? 60));
    },
  },
  {
    key: 'traverse',
    label: 'Traversability',
    getValue: (site) => {
      const inv = getScientificSiteInvestigation(site.id);
      return Math.min(100, Math.max(20, inv?.topography.traversableSlopePercentage ?? 70));
    },
  },
  {
    key: 'ice',
    label: 'Volatile Proximity',
    getValue: (site) => {
      const inv = getScientificSiteInvestigation(site.id);
      const psrPresent = inv?.illuminationThermal.psrPresent ?? false;
      const weh = inv?.resources.waterEquivalentHydrogenWtPct?.value ?? 0.1;
      return psrPresent ? Math.min(100, Math.round(weh * 140)) : 15;
    },
  },
  {
    key: 'safety',
    label: 'Landing Safety',
    getValue: (site) => {
      const inv = getScientificSiteInvestigation(site.id);
      const maxSlope = inv?.topography.maxSlopeDeg ?? 25;
      // Steeper max slope reduces landing safety
      return Math.min(100, Math.max(10, Math.round(100 - (maxSlope / 40) * 70)));
    },
  },
];

export const SITE_COLORS = [
  { stroke: '#06b6d4', fill: 'rgba(6,182,212,0.25)', label: 'text-cyan-400' },
  { stroke: '#f59e0b', fill: 'rgba(245,158,11,0.25)', label: 'text-amber-400' },
  { stroke: '#10b981', fill: 'rgba(16,185,129,0.25)', label: 'text-emerald-400' },
];
