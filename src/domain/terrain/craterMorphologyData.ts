/**
 * LOLA Polar Crater Morphology Catalog
 *
 * Ground truths and geodetic geometries for lunar south polar craters
 * (excavation cavities, rims, floor depths, and central peaks).
 * Grounded in NASA Goddard PGDA Products 78 & 90.
 */

export interface CraterMorphologyDatum {
  id: string;
  name: string;
  centerLatDeg: number;
  centerLonDeg: number;
  diameterKm: number;
  rimElevationMeters: number;
  floorElevationMeters: number;
  innerWallSlopeDeg: number;
  hasCentralPeak?: boolean;
  centralPeakHeightMeters?: number;
  isDeepPsr: boolean;
}

export const LOLA_POLAR_CRATER_MORPHOLOGIES: CraterMorphologyDatum[] = [
  {
    id: 'shackleton',
    name: 'Shackleton',
    centerLatDeg: -89.68,
    centerLonDeg: 125.0,
    diameterKm: 21.0,
    rimElevationMeters: 4250,
    floorElevationMeters: -4200,
    innerWallSlopeDeg: 32.5,
    isDeepPsr: true,
  },
  {
    id: 'de-gerlache',
    name: 'de Gerlache',
    centerLatDeg: -88.48,
    centerLonDeg: 271.4,
    diameterKm: 32.4,
    rimElevationMeters: 3610,
    floorElevationMeters: -1800,
    innerWallSlopeDeg: 26.0,
    isDeepPsr: true,
  },
  {
    id: 'shoemaker',
    name: 'Shoemaker',
    centerLatDeg: -88.14,
    centerLonDeg: 44.9,
    diameterKm: 50.9,
    rimElevationMeters: 3200,
    floorElevationMeters: -2800,
    innerWallSlopeDeg: 24.0,
    isDeepPsr: true,
  },
  {
    id: 'faustini',
    name: 'Faustini',
    centerLatDeg: -87.18,
    centerLonDeg: 77.0,
    diameterKm: 39.0,
    rimElevationMeters: 3100,
    floorElevationMeters: -2100,
    innerWallSlopeDeg: 22.0,
    isDeepPsr: true,
  },
  {
    id: 'haworth',
    name: 'Haworth',
    centerLatDeg: -87.40,
    centerLonDeg: 354.5,
    diameterKm: 51.4,
    rimElevationMeters: 3420,
    floorElevationMeters: -1600,
    innerWallSlopeDeg: 25.0,
    isDeepPsr: true,
  },
  {
    id: 'nobile',
    name: 'Nobile',
    centerLatDeg: -85.25,
    centerLonDeg: 37.8,
    diameterKm: 73.0,
    rimElevationMeters: 2980,
    floorElevationMeters: 1200,
    innerWallSlopeDeg: 15.0,
    isDeepPsr: false,
  },
  {
    id: 'amundsen',
    name: 'Amundsen',
    centerLatDeg: -84.45,
    centerLonDeg: 85.6,
    diameterKm: 105.0,
    rimElevationMeters: 2850,
    floorElevationMeters: -2100,
    innerWallSlopeDeg: 23.0,
    hasCentralPeak: true,
    centralPeakHeightMeters: 1800,
    isDeepPsr: true,
  },
];
