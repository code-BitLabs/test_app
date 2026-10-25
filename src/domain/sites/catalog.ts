import { CandidateSite, SiteCategory } from '@/domain/sites/candidateSite';
import { ARTEMIS_III_2024_SITES } from '@/domain/sites/data/artemisSites';
import { POLAR_BENCHMARK_SITES } from '@/domain/sites/data/benchmarkSites';
import { CLPS_SITES } from '@/domain/sites/data/clpsSites';
import { HISTORIC_SITES } from '@/domain/sites/data/historicSites';

export type { SiteCategory };

/**
 * Catalog Metadata & Lineage:
 * Distinguishes candidate named points from broad NASA region polygons.
 * Covers the October 2024 9-region Artemis III update, CLPS commercial landers,
 * and historic reference planetary baselines.
 */
export const CATALOG_METADATA = {
  catalogName: 'Lunar Exploration Candidate & Benchmark Landing Sites',
  catalogVersion: 'Space Apps 2026 Multitier Planetary Dataset',
  lineage: 'NASA Artemis 2024 candidate regions, CLPS mission flight manifests, and Apollo/CNSA ground truth baselines',
  officialUpdateNotice: 'Includes 9 official Artemis III candidate regions (Oct 2024 update), polar benchmarks, CLPS landers (IM-1, IM-2, Blue Ghost), and historic reference sites (Apollo 11, Apollo 17, Chang\'e 6).',
  coordinateConvention: 'IAU/IAG Lunar Mean Earth / Polar Axis (ME)',
  elevationDatum: 'Reference lunar sphere of R = 1737.4 km (LOLA DEM 128ppd)',
} as const;

/**
 * 20 Authoritative Lunar Landing Sites across 4 Mission Tiers:
 * 1. Artemis III 2024 (9 Official Regions)
 * 2. Polar Calibration Benchmarks (5 Sites)
 * 3. CLPS Commercial Landers (3 Sites: IM-1, IM-2, Blue Ghost)
 * 4. Historic & Reference Baselines (3 Sites: Apollo 11, Apollo 17, Chang'e 6)
 */
export const CANDIDATE_SITES: CandidateSite[] = [
  ...POLAR_BENCHMARK_SITES,
  ...ARTEMIS_III_2024_SITES,
  ...CLPS_SITES,
  ...HISTORIC_SITES,
];

export const DEFAULT_SITE_ID = 'shackleton-rim';

/** Opening comparison: the three south-pole rim/ridge sites. */
export const DEFAULT_COMPARISON_SITE_IDS: readonly string[] = [
  'shackleton-rim',
  'connecting-ridge',
  'malapert-massif',
];

/** The Nine Candidate Landing Regions officially confirmed by NASA in October 2024 for Artemis III. */
export const ARTEMIS_III_2024_REGION_IDS: readonly string[] = [
  'peak-near-cabeus-b',
  'haworth-rim',
  'malapert-massif',
  'mons-mouton',
  'mons-mouton-plateau',
  'nobile-rim-1',
  'nobile-rim-2',
  'de-gerlache-rim-2',
  'slater-plain',
];

/** The Five Historic South-Pole Calibration Benchmarks. */
export const POLAR_BENCHMARK_SITE_IDS: readonly string[] = [
  'shackleton-rim',
  'connecting-ridge',
  'de-gerlache-rim-1',
  'peak-near-shackleton',
  'amundsen-rim',
];

/** Commercial Lunar Payload Services (CLPS) Landing Sites. */
export const CLPS_SITE_IDS: readonly string[] = [
  'im-1-odysseus',
  'im-2-prime1',
  'firefly-blue-ghost',
];

/** Historic Planetary Baselines (Apollo 11, Apollo 17, Chang'e 6). */
export const HISTORIC_SITE_IDS: readonly string[] = [
  'apollo-11',
  'apollo-17',
  'change-6',
];

export type SiteCatalogFilter = 'artemis-iii-2024' | 'all' | SiteCategory;

export function getSitesByCategory(category: SiteCategory): CandidateSite[] {
  return CANDIDATE_SITES.filter((s) => s.category === category);
}

export function getFilteredCandidateSites(filter: SiteCatalogFilter = 'all'): CandidateSite[] {
  if (filter === 'artemis-iii-2024' || filter === 'artemis-2024') {
    return CANDIDATE_SITES.filter((s) => ARTEMIS_III_2024_REGION_IDS.includes(s.id));
  }
  if (filter === 'polar-benchmark') {
    return getSitesByCategory('polar-benchmark');
  }
  if (filter === 'clps') {
    return getSitesByCategory('clps');
  }
  if (filter === 'historic') {
    return getSitesByCategory('historic');
  }
  return CANDIDATE_SITES;
}

export function getSiteById(id: string): CandidateSite | undefined {
  return CANDIDATE_SITES.find((s) => s.id === id);
}
