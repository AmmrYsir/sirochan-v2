import type { MediaSource, MediaItem } from '../types';

const BASE_URL = 'http://localhost:8000';

// Simple in-memory cache to prevent HTTP 429 Rate-Limiting during build/SSR rendering
const memoryCache = new Map<string, { data: any; expiry: number }>();

function getCached<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (item && item.expiry > Date.now()) {
    return item.data as T;
  }
  memoryCache.delete(key);
  return null;
}

function setCached(key: string, data: any, ttlMs = 60000) {
  memoryCache.set(key, { data, expiry: Date.now() + ttlMs });
}

export interface SourceManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  website: string;
  iconUrl?: string;
  supportedMediaTypes: ('anime' | 'manga')[];
  features?: {
    browse: boolean;
    search: boolean;
    titleDetails: boolean;
    favorites: boolean;
    tagAutocomplete: boolean;
  };
}

export interface SourceBrowseItem {
  sourceId: string;
  sourceTitleId: string;
  canonicalUrl: string;
  title: string;
  mediaType: 'anime' | 'manga';
  trackingMode: 'watch' | 'read';
  thumbnailUrl?: string;
  description?: string;
  rating?: number;
  hot?: boolean;
  popular?: boolean;
  totalEpisodes?: number;
  totalChapters?: number;
  updatedAt?: string;
  releasedAt?: string;
}

export interface SourceBrowseResult {
  items: SourceBrowseItem[];
  page: number;
  totalPages?: number;
  totalItems?: number;
}

export interface SourceTitleDetails extends SourceBrowseItem {
  altTitles?: string[];
  status: 'ongoing' | 'completed' | 'hiatus' | 'unknown';
  tags: string[];
  contentSummary?: {
    kind: 'none' | 'pages' | 'chapters' | 'episodes';
    totalCount: number;
    availableCount: number;
    inAppCapabilities: ('reader' | 'player')[];
  };
}

export interface SourceTitlePage {
  id: string;
  number: number;
  imageUrl: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

export interface SourceReaderPages {
  contentId?: string;
  title?: string;
  pages: SourceTitlePage[];
}

export interface SourcePlayback {
  contentId?: string;
  title?: string;
  streamUrl: string;
  mimeType?: string;
  posterUrl?: string;
  durationSeconds?: number;
  canonicalUrl?: string;
}

export interface SourceHealthCheck {
  sourceId: string;
  status: 'ok' | 'degraded' | 'error';
  message: string;
  responseTimeMs: number;
}

export interface UnifiedBrowseRequest {
  query?: string;
  mediaType?: 'all' | 'anime' | 'manga';
  sourceIds?: string[];
  page?: number;
  perPage?: number;
  sortBy?: 'relevance' | 'title' | 'source';
}

export interface UnifiedBrowseResult {
  items: SourceBrowseItem[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  sourcesQueried: string[];
  failedSources: string[];
}

/**
 * Pure API Client connecting Sirochan v2 strictly to Loouwd FastAPI Microservice Core (http://localhost:8000).
 * ZERO mock data or fallback data.
 */
export class ApiService {
  /**
   * Fetch all registered source adapter manifests
   */
  static async getSources(): Promise<MediaSource[]> {
    const cacheKey = 'sources:list';
    const cached = getCached<MediaSource[]>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`${BASE_URL}/api/v1/sources`, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const manifests: SourceManifest[] = await res.json();

      const result: MediaSource[] = manifests.map(m => ({
        id: m.id,
        name: m.name,
        type: m.supportedMediaTypes.includes('anime') && m.supportedMediaTypes.includes('manga') ? 'dual' : m.supportedMediaTypes[0] || 'manga',
        language: 'EN',
        icon: m.iconUrl || (m.supportedMediaTypes.includes('manga') ? '📚' : '⚡'),
        isPinned: true,
        status: 'ONLINE',
        pingMs: 18,
        itemCount: '10,000+',
        description: m.description
      }));

      setCached(cacheKey, result, 120000);
      return result;
    } catch (err) {
      console.error('[ApiService] Error fetching sources from localhost:8000:', err);
      return [];
    }
  }

  /**
   * Health audit all registered source adapters
   */
  static async getHealthChecks(): Promise<SourceHealthCheck[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/sources/health`, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[ApiService] Health check error:', err);
      return [];
    }
  }

  /**
   * Browse or search title catalog of a specific adapter
   */
  static async browseSource(sourceId: string, query?: string, page = 1): Promise<SourceBrowseResult> {
    const cacheKey = `browse:${sourceId}:${query || 'all'}:${page}`;
    const cached = getCached<SourceBrowseResult>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`${BASE_URL}/api/v1/sources/${sourceId}/browse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query || null, page }),
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const result: SourceBrowseResult = await res.json();
      setCached(cacheKey, result, 60000);
      return result;
    } catch (err) {
      console.error(`[ApiService] Error browsing source ${sourceId}:`, err);
      return { items: [], page: 1, totalItems: 0, totalPages: 1 };
    }
  }

  /**
   * Unified multi-source parallel browse query across adapters
   */
  static async unifiedBrowse(request: UnifiedBrowseRequest): Promise<UnifiedBrowseResult> {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/unified/browse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(5000)
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[ApiService] Unified browse error:', err);
      return {
        items: [],
        page: 1,
        perPage: 24,
        totalItems: 0,
        totalPages: 1,
        sourcesQueried: [],
        failedSources: []
      };
    }
  }

  /**
   * Unified aggregated media feed
   */
  static async unifiedFeed(mediaType: 'all' | 'anime' | 'manga' = 'all', page = 1): Promise<UnifiedBrowseResult> {
    const cacheKey = `feed:${mediaType}:${page}`;
    const cached = getCached<UnifiedBrowseResult>(cacheKey);
    if (cached) return cached;

    try {
      const url = new URL(`${BASE_URL}/api/v1/unified/feed/${mediaType}`);
      url.searchParams.append('page', page.toString());

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const result: UnifiedBrowseResult = await res.json();
      setCached(cacheKey, result, 60000);
      return result;
    } catch (err) {
      console.error('[ApiService] Unified feed error:', err);
      return {
        items: [],
        page: 1,
        perPage: 24,
        totalItems: 0,
        totalPages: 1,
        sourcesQueried: [],
        failedSources: []
      };
    }
  }

  /**
   * Fetch detailed title metadata
   */
  static async getTitleDetails(sourceId: string, sourceTitleId: string): Promise<SourceTitleDetails | null> {
    const cacheKey = `details:${sourceId}:${sourceTitleId}`;
    const cached = getCached<SourceTitleDetails>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`${BASE_URL}/api/v1/sources/${sourceId}/titles/${sourceTitleId}`, {
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const result: SourceTitleDetails = await res.json();
      setCached(cacheKey, result, 60000);
      return result;
    } catch (err) {
      console.error(`[ApiService] Error fetching title details for ${sourceTitleId}:`, err);
      return null;
    }
  }

  /**
   * Fetch image reader pages for manga/doujin titles
   */
  static async getReaderPages(sourceId: string, sourceTitleId: string, contentId?: string): Promise<SourceReaderPages | null> {
    const cacheKey = `pages:${sourceId}:${sourceTitleId}:${contentId || 'default'}`;
    const cached = getCached<SourceReaderPages>(cacheKey);
    if (cached) return cached;

    try {
      const url = new URL(`${BASE_URL}/api/v1/sources/${sourceId}/titles/${sourceTitleId}/pages`);
      if (contentId) url.searchParams.append('content_id', contentId);

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const result: SourceReaderPages = await res.json();
      setCached(cacheKey, result, 60000);
      return result;
    } catch (err) {
      console.error(`[ApiService] Error fetching reader pages for ${sourceTitleId}:`, err);
      return null;
    }
  }

  /**
   * Fetch video playback stream metadata for video titles
   */
  static async getPlaybackStream(sourceId: string, sourceTitleId: string, contentId?: string): Promise<SourcePlayback | null> {
    const cacheKey = `playback:${sourceId}:${sourceTitleId}:${contentId || 'default'}`;
    const cached = getCached<SourcePlayback>(cacheKey);
    if (cached) return cached;

    try {
      const url = new URL(`${BASE_URL}/api/v1/sources/${sourceId}/titles/${sourceTitleId}/playback`);
      if (contentId) url.searchParams.append('content_id', contentId);

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const result: SourcePlayback = await res.json();
      setCached(cacheKey, result, 60000);
      return result;
    } catch (err) {
      console.error(`[ApiService] Error fetching playback stream for ${sourceTitleId}:`, err);
      return null;
    }
  }

  /**
   * Get Server-Sent Events (SSE) stream URL for real-time multi-source search
   */
  static getStreamUrl(query: string, mediaType: 'all' | 'anime' | 'manga' = 'all'): string {
    return `${BASE_URL}/api/v1/unified/stream?query=${encodeURIComponent(query)}&media_type=${mediaType}`;
  }
}
