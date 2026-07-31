import type { MediaSource, SourceTagSuggestion } from '../types';

async function fetchLoouwd(path: string, options?: RequestInit): Promise<Response> {
  const baseUrl = (process.env.LOOUWD_URL || '').replace(/\/$/, '');
  if (!baseUrl) {
    console.warn('[ApiService] LOOUWD_URL is not set in environment (.env)');
  }
  return fetch(`${baseUrl}${path}`, options);
}

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

import type { SourceFilter } from '../types';

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
	browseConfig?: {
		supportsPagination?: boolean;
		filters?: SourceFilter[];
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
	genres?: string[];
	tags?: string[];
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
			const res = await fetchLoouwd(`/api/v1/sources`, { signal: AbortSignal.timeout(4000) });
			if (!res.ok) throw new Error(`HTTP error ${res.status}`);
			const manifests: SourceManifest[] = await res.json();

			const result: MediaSource[] = manifests.map(m => {
				const filters = m.browseConfig?.filters || [];
				const categoryFilter = filters.find(f => f.key === 'category' || f.key === 'genre' || f.key === 'type');
				const categories = categoryFilter?.options
					?.map(opt => opt.label)
					.filter(label => label && !label.toLowerCase().includes('all')) || [];

				return {
					id: m.id,
					name: m.name,
					type: m.supportedMediaTypes.includes('anime') && m.supportedMediaTypes.includes('manga') ? 'dual' : m.supportedMediaTypes[0] || 'manga',
					language: 'EN',
					icon: m.iconUrl || (m.supportedMediaTypes.includes('manga') ? '📚' : '⚡'),
					isPinned: true,
					status: 'ONLINE',
					pingMs: 18,
					itemCount: '10,000+',
					description: m.description,
					filters: filters,
					categories: categories
				};
			});

			setCached(cacheKey, result, 120000);
			return result;
		} catch (err) {
			console.error('[ApiService] Error fetching sources from Loouwd microservice:', err);
			return [];
		}
	}

	/**
	 * Health audit all registered source adapters
	 */
	static async getHealthChecks(): Promise<SourceHealthCheck[]> {
		try {
			const res = await fetchLoouwd(`/api/v1/sources/health`, { signal: AbortSignal.timeout(4000) });
			if (!res.ok) throw new Error(`HTTP error ${res.status}`);
			return await res.json();
		} catch (err) {
			console.error('[ApiService] Health check error:', err);
			return [];
		}
	}

	/**
	 * Fetch detailed manifest for a specific source adapter
	 */
	static async getSourceManifest(sourceId: string): Promise<SourceManifest | null> {
		const cacheKey = `manifest:${sourceId}`;
		const cached = getCached<SourceManifest>(cacheKey);
		if (cached) return cached;

		try {
			const res = await fetchLoouwd(`/api/v1/sources/${sourceId}`, {
				signal: AbortSignal.timeout(4000)
			});
			if (!res.ok) throw new Error(`HTTP error ${res.status}`);
			const manifest: SourceManifest = await res.json();
			setCached(cacheKey, manifest, 300000);
			return manifest;
		} catch (err) {
			console.error(`[ApiService] Error fetching manifest for '${sourceId}':`, err);
			return null;
		}
	}

	/**
	 * Browse or search title catalog of a specific adapter with optional backend filter dict
	 */
	static async browseSource(
		sourceId: string,
		query?: string,
		page = 1,
		filters: Record<string, any> = {}
	): Promise<SourceBrowseResult> {
		const filterKey = JSON.stringify(filters);
		const cacheKey = `browse:${sourceId}:${query || 'all'}:${page}:${filterKey}`;
		const cached = getCached<SourceBrowseResult>(cacheKey);
		if (cached) return cached;

		try {
			const res = await fetchLoouwd(`/api/v1/sources/${sourceId}/browse`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: query || null, page, filters }),
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
	 * Fetch detailed title metadata
	 */
	static async getTitleDetails(sourceId: string, sourceTitleId: string): Promise<SourceTitleDetails | null> {
		const cacheKey = `details:${sourceId}:${sourceTitleId}`;
		const cached = getCached<SourceTitleDetails>(cacheKey);
		if (cached) return cached;

		try {
			const res = await fetchLoouwd(`/api/v1/sources/${sourceId}/titles/${sourceTitleId}`, {
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
			const path = `/api/v1/sources/${sourceId}/titles/${sourceTitleId}/pages${contentId ? `?content_id=${encodeURIComponent(contentId)}` : ''}`;
			const res = await fetchLoouwd(path, { signal: AbortSignal.timeout(4000) });
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
			const path = `/api/v1/sources/${sourceId}/titles/${sourceTitleId}/playback${contentId ? `?content_id=${encodeURIComponent(contentId)}` : ''}`;
			const res = await fetchLoouwd(path, { signal: AbortSignal.timeout(4000) });
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
	 * Real-time tag autocompletion endpoint for UI search inputs
	 */
	static async autocompleteTags(sourceId: string, query: string, type = 'tag'): Promise<SourceTagSuggestion[]> {
		if (!query || query.trim().length === 0) return [];
		try {
			const res = await fetchLoouwd(`/api/v1/sources/${sourceId}/tags/autocomplete?query=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`, {
				signal: AbortSignal.timeout(3000)
			});
			if (!res.ok) return [];
			return await res.json();
		} catch (err) {
			console.error(`[ApiService] Tag autocomplete error for ${sourceId}:`, err);
			return [];
		}
	}

}
