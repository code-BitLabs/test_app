/**
 * NASA Image & Video Library Proxy Service
 *
 * Proxies searches and asset manifest lookups to NASA's public media API:
 * - Search: https://images-api.nasa.gov/search?q={query}&media_type={type}
 * - Asset Manifest: https://images-api.nasa.gov/asset/{nasa_id}
 *
 * Implements in-memory LRU caching with 24-hour TTL and authentic offline fallback
 * fixtures featuring curated SVS, LRO, Apollo, and Artemis mission media.
 */

import { NASA_FOOTAGE_MANIFEST, type NasaFootageItem } from '@/features/gallery/data/nasaFootageManifest';

interface MediaCacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MediaLruCache<T> {
  private cache = new Map<string, MediaCacheEntry<T>>();

  constructor(
    private maxEntries = 100,
    private ttlMs = 24 * 3600_000, // 24 hours TTL
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

export interface MediaSearchResult {
  source: 'nasa_images_api_live' | 'curated_offline_fallback';
  cached?: boolean;
  totalHits: number;
  items: Array<{
    nasaId: string;
    title: string;
    description: string;
    mediaType: string;
    center: string;
    year: number;
    thumbnailUrl: string;
    videoUrl?: string;
    keywords: string[];
    credit: string;
  }>;
}

export interface MediaAssetResult {
  nasaId: string;
  source: 'nasa_asset_api_live' | 'curated_offline_fallback';
  cached?: boolean;
  collection: {
    items: Array<{ href: string }>;
  };
}

export class NasaMediaProxyService {
  private searchCache = new MediaLruCache<MediaSearchResult>(100, 24 * 3600_000);
  private assetCache = new MediaLruCache<MediaAssetResult>(100, 24 * 3600_000);

  getSearchCache(): MediaLruCache<MediaSearchResult> {
    return this.searchCache;
  }

  getAssetCache(): MediaLruCache<MediaAssetResult> {
    return this.assetCache;
  }

  private fallbackSearch(query: string, mediaType?: string): MediaSearchResult {
    const qLower = (query || '').toLowerCase().trim();
    const filtered = NASA_FOOTAGE_MANIFEST.filter((item) => {
      const matchesQuery =
        !qLower ||
        item.title.toLowerCase().includes(qLower) ||
        item.description.toLowerCase().includes(qLower) ||
        item.keywords.some((k) => k.toLowerCase().includes(qLower)) ||
        item.category.toLowerCase().includes(qLower);

      const matchesType =
        !mediaType ||
        (mediaType.includes('video') && Boolean(item.videoUrl)) ||
        (mediaType.includes('image') && Boolean(item.thumbnailUrl));

      return matchesQuery && matchesType;
    });

    return {
      source: 'curated_offline_fallback',
      totalHits: filtered.length,
      items: filtered.map((item) => ({
        nasaId: item.nasaId,
        title: item.title,
        description: item.description,
        mediaType: item.videoUrl ? 'video' : 'image',
        center: item.nasaCenter,
        year: item.year,
        thumbnailUrl: item.thumbnailUrl,
        videoUrl: item.videoUrl,
        keywords: item.keywords,
        credit: item.credit,
      })),
    };
  }

  private fallbackAsset(nasaId: string): MediaAssetResult {
    const matched = NASA_FOOTAGE_MANIFEST.find(
      (item) => item.nasaId.toLowerCase() === nasaId.toLowerCase() || item.id === nasaId,
    );

    const items: Array<{ href: string }> = [];
    if (matched) {
      if (matched.videoUrl) items.push({ href: matched.videoUrl });
      if (matched.thumbnailUrl) items.push({ href: matched.thumbnailUrl });
    } else {
      items.push({
        href: `https://images-assets.nasa.gov/image/${encodeURIComponent(nasaId)}/${encodeURIComponent(nasaId)}~orig.jpg`,
      });
    }

    return {
      nasaId,
      source: 'curated_offline_fallback',
      collection: { items },
    };
  }

  async searchMedia(
    query = '',
    mediaType = 'image,video',
    timeoutMs = 2500,
  ): Promise<MediaSearchResult> {
    const cacheKey = `search_${query.toLowerCase().trim()}_${mediaType}`;
    const cached = this.searchCache.get(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    const fallback = this.fallbackSearch(query, mediaType);
    const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=${encodeURIComponent(mediaType)}`;

    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

      const res = await fetch(url, { signal: controller?.signal });
      if (timeoutId) clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const items = (data?.collection?.items || []).map((raw: any) => {
          const itemData = raw.data?.[0] || {};
          const links = raw.links || [];
          const thumb = links.find((l: any) => l.rel === 'preview')?.href || '';
          return {
            nasaId: itemData.nasa_id || '',
            title: itemData.title || '',
            description: itemData.description || '',
            mediaType: itemData.media_type || 'image',
            center: itemData.center || 'NASA',
            year: itemData.date_created ? new Date(itemData.date_created).getFullYear() : 2024,
            thumbnailUrl: thumb,
            keywords: itemData.keywords || [],
            credit: itemData.secondary_creator || 'NASA',
          };
        });

        const liveResult: MediaSearchResult = {
          source: 'nasa_images_api_live',
          totalHits: data?.collection?.metadata?.total_hits ?? items.length,
          items,
        };
        this.searchCache.set(cacheKey, liveResult);
        return liveResult;
      }
    } catch {
      // Offline fallback
    }

    this.searchCache.set(cacheKey, fallback);
    return fallback;
  }

  async getAssetManifest(nasaId: string, timeoutMs = 2500): Promise<MediaAssetResult> {
    const cacheKey = `asset_${nasaId.toLowerCase().trim()}`;
    const cached = this.assetCache.get(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    const fallback = this.fallbackAsset(nasaId);
    const url = `https://images-api.nasa.gov/asset/${encodeURIComponent(nasaId)}`;

    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

      const res = await fetch(url, { signal: controller?.signal });
      if (timeoutId) clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const items = data?.collection?.items || [];
        const liveResult: MediaAssetResult = {
          nasaId,
          source: 'nasa_asset_api_live',
          collection: { items },
        };
        this.assetCache.set(cacheKey, liveResult);
        return liveResult;
      }
    } catch {
      // Offline fallback
    }

    this.assetCache.set(cacheKey, fallback);
    return fallback;
  }
}

export const nasaMediaProxyService = new NasaMediaProxyService();
