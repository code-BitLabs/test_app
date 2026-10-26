import { calculateSiteConditions } from '@domain/celestial/siteConditions';
import { CANDIDATE_SITES } from '@domain/sites/catalog';
import {
  calculateRfLinkBudget,
  calculateDsnStationVisibilities,
  determineActiveDsnStation,
  type FrequencyBandKey,
} from '@domain/telecom/linkBudget';
import { calculateTraversalPlan } from '@domain/traversal/traversePlanner';
import type { TraversalPlan, TraversalPlanRequest } from '@domain/traversal/types';
import { prospectVolatilesAtCoordinates } from '@domain/volatiles/volatileProspector';
import type { VolatileProspectingResult } from '@domain/volatiles/types';
import type { CalculationMode } from '@domain/celestial/calculationMode';

export interface MissionServerClientConfig {
  baseUrl: string;
  timeoutMs: number;
}

const DEFAULT_CONFIG: MissionServerClientConfig = {
  baseUrl: 'http://localhost:3001/api',
  timeoutMs: 1500,
};

export class MissionServerClient {
  constructor(private readonly config: MissionServerClientConfig = DEFAULT_CONFIG) {}

  withBaseUrl(baseUrl: string): MissionServerClient {
    return new MissionServerClient({ ...this.config, baseUrl });
  }

  async checkHealth(): Promise<{ status: string; framework: string } | null> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), this.config.timeoutMs);
      const res = await fetch(`${this.config.baseUrl}/health`, { signal: controller.signal });
      clearTimeout(id);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async getConditions(input: {
    siteId: string;
    epochMs: number;
    calculationMode?: CalculationMode;
  }) {
    // Attempt NextRush backend API call
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), this.config.timeoutMs);
      const res = await fetch(`${this.config.baseUrl}/ephemeris/conditions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      clearTimeout(id);
      if (res.ok) {
        const data = await res.json();
        return { ...data, source: 'nextrush_server' as const };
      }
    } catch {
      // Backend offline or timed out; execute local domain fallback
    }

    // Local resilient domain calculation fallback
    const site = CANDIDATE_SITES.find((s) => s.id === input.siteId) || CANDIDATE_SITES[0];
    const mode: CalculationMode = input.calculationMode || 'geometry-only';
    const conditions = calculateSiteConditions(site, new Date(input.epochMs), mode);

    return {
      siteId: site.id,
      siteName: site.name,
      coordinates: site.coordinates,
      epochIso: conditions.epochUtc,
      epochMs: input.epochMs,
      calculationMode: mode,
      solarElevationDeg: conditions.sunElevationDeg.kind === 'available' ? conditions.sunElevationDeg.value : null,
      solarAzimuthDeg: conditions.sunAzimuthDeg.kind === 'available' ? conditions.sunAzimuthDeg.value : null,
      solarIllumination: conditions.solarIllumination,
      earthElevationDeg: conditions.earthElevationDeg.kind === 'available' ? conditions.earthElevationDeg.value : null,
      earthAzimuthDeg: conditions.earthAzimuthDeg.kind === 'available' ? conditions.earthAzimuthDeg.value : null,
      earthDistanceKm: conditions.rangeKm.kind === 'available' ? conditions.rangeKm.value : 384400,
      lightTimeSeconds: conditions.theoreticalOneWayLightTimeSeconds.kind === 'available' ? conditions.theoreticalOneWayLightTimeSeconds.value : 1.28,
      provenance: conditions.provenance,
      source: 'local_analytical_fallback' as const,
    };
  }

  async getLinkBudget(input: {
    siteId: string;
    epochMs: number;
    band?: FrequencyBandKey;
    transmitterPowerWatts?: number;
    dataRateMbps?: number;
  }) {
    // Attempt NextRush backend API call
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), this.config.timeoutMs);
      const res = await fetch(`${this.config.baseUrl}/telecom/link-budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      clearTimeout(id);
      if (res.ok) {
        const data = await res.json();
        return { ...data, source: 'nextrush_server' as const };
      }
    } catch {
      // Backend offline; execute local domain fallback
    }

    // Local fallback
    const conditions = await this.getConditions({ siteId: input.siteId, epochMs: input.epochMs });
    const band = input.band || 'xBandDownlink';
    const earthElevationDeg = conditions.earthElevationDeg ?? -90;

    const linkBudget = calculateRfLinkBudget({
      earthDistanceKm: conditions.earthDistanceKm,
      earthElevationDeg,
      isTerrainObstructed: earthElevationDeg <= 0,
      band,
      transmitterPowerWatts: input.transmitterPowerWatts ?? 15,
      dataRateMbps: input.dataRateMbps ?? 2.0,
    });

    const stations = calculateDsnStationVisibilities(input.epochMs);
    const activeStation = determineActiveDsnStation(stations);

    return {
      siteId: conditions.siteId,
      siteName: conditions.siteName,
      epochMs: input.epochMs,
      earthElevationDeg,
      earthDistanceKm: conditions.earthDistanceKm,
      linkBudget,
      dsnTracking: {
        stations,
        activeStation,
      },
      source: 'local_analytical_fallback' as const,
    };
  }

  async getTraversalPlan(input: TraversalPlanRequest): Promise<TraversalPlan & { source: 'nextrush_server' | 'local_analytical_fallback' }> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), this.config.timeoutMs);
      const res = await fetch(`${this.config.baseUrl}/traversal/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      clearTimeout(id);
      if (res.ok) {
        const body = await res.json();
        if (body.data) {
          return { ...body.data, source: 'nextrush_server' as const };
        }
      }
    } catch {
      // Backend offline; fallback to local analytical calculation
    }

    const plan = calculateTraversalPlan(input);
    return { ...plan, source: 'local_analytical_fallback' as const };
  }

  async getVolatileProspect(input: {
    latDeg: number;
    lonDeg: number;
  }): Promise<VolatileProspectingResult & { source: 'nextrush_server' | 'local_analytical_fallback' }> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), this.config.timeoutMs);
      const res = await fetch(`${this.config.baseUrl}/volatiles/prospect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      clearTimeout(id);
      if (res.ok) {
        const body = await res.json();
        if (body.data) {
          return { ...body.data, source: 'nextrush_server' as const };
        }
      }
    } catch {
      // Backend offline; execute local analytical fallback
    }

    const data = prospectVolatilesAtCoordinates(input.latDeg, input.lonDeg);
    return { ...data, source: 'local_analytical_fallback' as const };
  }
}

export const missionServerClient = new MissionServerClient();
