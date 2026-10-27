import { DEFAULT_PROJECTION_CONFIG, unprojectCoordinates } from '@/domain/coordinates/projection';
import {
  sampleTerrainAtLatLon,
  getSlopeRgb,
  getGeologyUnitRgb,
  getIlluminationRgb,
} from '@/features/spatial/globe/terrain/lolaSouthPoleDemSampler';
import { getNasaSvsElevationRgb } from '@/domain/terrain/nasaSvsColorRamp';
import { getVolatilesRgb, getTemperatureRgb } from '@/domain/volatiles/volatileColorMaps';
import { evaluateLendNeutronFlux } from '@/domain/volatiles/lendNeutronModel';
import { evaluateDivinerTemperature } from '@/domain/volatiles/divinerThermalModel';
import { ScientificMapLayerMode } from '@/features/spatial/model/spatialPreferences';

const RASTER_CACHE = new Map<ScientificMapLayerMode, string>();

/**
 * Generates an authentic raster data URL for the 2D Lunar South Pole map
 * covering 83.0°S to 90.0°S with IAU 2000 ME projection alignment.
 */
export function generateScientificMapRasterUrl(
  mode: ScientificMapLayerMode,
  resolution = 360,
): string | null {
  if (mode === 'none') return null;

  const cached = RASTER_CACHE.get(mode);
  if (cached) return cached;

  if (typeof globalThis.document === 'undefined') return null;

  const canvas = globalThis.document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imgData = ctx.createImageData(resolution, resolution);
  const data = imgData.data;

  const projConfig = {
    ...DEFAULT_PROJECTION_CONFIG,
    svgSize: resolution,
    center: resolution / 2,
    maxRadius: resolution * (DEFAULT_PROJECTION_CONFIG.maxRadius / DEFAULT_PROJECTION_CONFIG.svgSize),
  };

  const center = projConfig.center;
  const maxRadius = projConfig.maxRadius;
  const maxRadiusSq = maxRadius * maxRadius;

  for (let py = 0; py < resolution; py++) {
    for (let px = 0; px < resolution; px++) {
      const idx = (py * resolution + px) * 4;
      const dx = px - center;
      const dy = py - center;
      const distSq = dx * dx + dy * dy;

      if (distSq > maxRadiusSq) {
        // Transparent outside polar disc
        data[idx + 3] = 0;
        continue;
      }

      const coord = unprojectCoordinates(px, py, projConfig);
      if (!coord) {
        data[idx + 3] = 0;
        continue;
      }

      const sample = sampleTerrainAtLatLon(coord.latitudeDeg, coord.longitudeDeg);

      let rgb: [number, number, number];
      switch (mode) {
        case 'topography':
          rgb = getNasaSvsElevationRgb(sample.elevationMeters);
          break;
        case 'hillshade': {
          const val = Math.round(sample.hillshade * 255);
          rgb = [val, val, val];
          break;
        }
        case 'slope':
          rgb = getSlopeRgb(sample.slopeDeg);
          break;
        case 'geology':
          rgb = getGeologyUnitRgb(sample.geologicalUnitCode);
          break;
        case 'illumination':
          rgb = getIlluminationRgb(sample.annualIlluminationPct, sample.isPermanentlyShadowed);
          break;
        case 'volatiles': {
          const neutron = evaluateLendNeutronFlux(coord.latitudeDeg, coord.longitudeDeg);
          rgb = getVolatilesRgb(neutron.hydrogenWeightPct);
          break;
        }
        case 'temperature': {
          const thermal = evaluateDivinerTemperature(coord.latitudeDeg, coord.longitudeDeg);
          rgb = getTemperatureRgb(thermal.tempKelvin);
          break;
        }
        default:
          rgb = [40, 50, 70];
      }

      data[idx] = rgb[0];
      data[idx + 1] = rgb[1];
      data[idx + 2] = rgb[2];
      data[idx + 3] = 230; // 90% opacity to blend harmoniously with graticule & vector overlay
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const dataUrl = canvas.toDataURL('image/png');
  RASTER_CACHE.set(mode, dataUrl);
  return dataUrl;
}
