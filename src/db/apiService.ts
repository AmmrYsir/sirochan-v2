import type { MediaSource, MediaItem } from '../types';
import { mockSources, mockMediaList } from './mockData';

const BASE_URL = 'http://localhost:8000';

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
 * Production-grade API Client connecting Sirochan v2 to Loouwd FastAPI Microservice Core.
 */
export class ApiService {
  /**
   * Fetch all registered source adapter manifests
   */
  static async getSources(): Promise<MediaSource[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/sources`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const manifests: SourceManifest[] = await res.json();

      return manifests.map(m => ({
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
    } catch (err) {
      console.warn('[ApiService] Failed to fetch live sources from localhost:8000, using fallback:', err);
      return mockSources;
    }
  }

  /**
   * Health audit all registered source adapters
   */
  static async getHealthChecks(): Promise<SourceHealthCheck[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/sources/health`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[ApiService] Health check failed:', err);
      return [];
    }
  }

  /**
   * Browse or search title catalog of a specific adapter
   */
  static async browseSource(sourceId: string, query?: string, page = 1): Promise<SourceBrowseResult> {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/sources/${sourceId}/browse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query || null, page }),
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`[ApiService] Failed to browse source ${sourceId}, using fallback:`, err);
      return {
        items: mockMediaList.map(m => ({
          sourceId,
          sourceTitleId: m.id,
          canonicalUrl: `/manga/${m.id}`,
          title: m.title,
          mediaType: m.type,
          trackingMode: m.type === 'manga' ? 'read' : 'watch',
          thumbnailUrl: m.coverImage,
          description: m.description,
          rating: m.rating,
          popular: true
        })),
        page: 1,
        totalItems: mockMediaList.length
      };
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
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[ApiService] Unified browse failed, using fallback:', err);
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
    try {
      const url = new URL(`${BASE_URL}/api/v1/unified/feed/${mediaType}`);
      url.searchParams.append('page', page.toString());

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[ApiService] Unified feed failed:', err);
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
    try {
      const res = await fetch(`${BASE_URL}/api/v1/sources/${sourceId}/titles/${sourceTitleId}`, {
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`[ApiService] Failed to fetch title details for ${sourceTitleId}:`, err);
      return null;
    }
  }

  /**
   * Fetch image reader pages for manga/doujin titles
   */
  static async getReaderPages(sourceId: string, sourceTitleId: string, contentId?: string): Promise<SourceReaderPages | null> {
    try {
      const url = new URL(`${BASE_URL}/api/v1/sources/${sourceId}/titles/${sourceTitleId}/pages`);
      if (contentId) url.searchParams.append('content_id', contentId);

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`[ApiService] Failed to fetch reader pages for ${sourceTitleId}:`, err);
      return null;
    }
  }

  /**
   * Fetch video playback stream metadata for video titles
   */
  static async getPlaybackStream(sourceId: string, sourceTitleId: string, contentId?: string): Promise<SourcePlayback | null> {
    try {
      const url = new URL(`${BASE_URL}/api/v1/sources/${sourceId}/titles/${sourceTitleId}/playback`);
      if (contentId) url.searchParams.append('content_id', contentId);

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`[ApiService] Failed to fetch playback stream for ${sourceTitleId}:`, err);
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
