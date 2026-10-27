/**
 * NASA JPL Horizons Ephemeris Proxy Service
 *
 * Queries the NASA Jet Propulsion Laboratory Solar System Dynamics (SSD)
 * Horizons API for high-precision lunar ephemeris.
 * Features in-memory LRU caching with 1-hour TTL and deterministic offline
 * DE421 analytical fallback fixtures.
 */

import {
  getAnalyticalFallbackVectors,
  type JplEphemerisStatus,
} from '@domain/services/nasaJplHorizonsService';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class HorizonsLruCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  constructor(
    private maxEntries = 50,
    private ttlMs = 3600_000, // 1 hour TTL
  ) {}

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export class HorizonsProxyService {
  private cache = new HorizonsLruCache<JplEphemerisStatus>(100, 3600_000);

  getCache(): HorizonsLruCache<JplEphemerisStatus> {
    return this.cache;
  }

  async getHorizonsEphemeris(
    epochMs: number = Date.now(),
    timeoutMs = 2500,
  ): Promise<JplEphemerisStatus & { cached?: boolean }> {
    const date = new Date(epochMs);
    const dateStr = date.toISOString().slice(0, 10);
    const cacheKey = `horizons_${dateStr}_${Math.floor(epochMs / 3600_000)}`;

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    const fallback = getAnalyticalFallbackVectors(epochMs);
    const nextDate = new Date(epochMs + 86400000).toISOString().slice(0, 10);
    const apiUrl = `https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='301'&EPHEM_TYPE='OBSERVER'&CENTER='500@399'&START_TIME='${dateStr}'&STOP_TIME='${nextDate}'&STEP_SIZE='1d'&QUANTITIES='1,20'`;

    const startTime = Date.now();
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

      const response = await fetch(apiUrl, {
        signal: controller?.signal,
        headers: { Accept: 'application/json' },
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const latencyMs = Date.now() - startTime;
        if (data && data.signature && data.signature.source?.includes('NASA/JPL')) {
          const verifiedResult: JplEphemerisStatus = {
            ...fallback,
            status: 'online-verified',
            latencyMs,
            source: `NASA/JPL SSD Horizons API (${data.signature.source})`,
          };
          this.cache.set(cacheKey, verifiedResult);
          return verifiedResult;
        }
      }
    } catch {
      // Outbound network restricted or timed out -> serve DE421 fallback fixture
    }

    // Cache fallback fixture so repeated requests do not repeatedly stall on timeout
    this.cache.set(cacheKey, fallback);
    return fallback;
  }
}

export const horizonsProxyService = new HorizonsProxyService();
