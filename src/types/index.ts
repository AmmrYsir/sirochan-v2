export type MediaType = 'manga' | 'anime';

export interface MangaChapter {
  id: string;
  mediaId: string;
  chapterNumber: number;
  title: string;
  totalPages: number;
  pages: string[];
  releaseDate: string;
  readProgressPercent?: number;
}

export interface AnimeEpisode {
  id: string;
  mediaId: string;
  episodeNumber: number;
  seasonNumber: number;
  title: string;
  duration: string; // e.g. "23:10"
  timeMarker?: string; // e.g. "12:45"
  videoUrl: string;
  thumbnail: string;
  watchProgressPercent?: number;
}

export interface SourceFilterOption {
  value: string;
  label: string;
}

export interface SourceFilter {
  key: string;
  label: string;
  type: string;
  options?: SourceFilterOption[];
  defaultValue?: any;
  placeholder?: string;
}

export interface SourceTagSuggestion {
  name: string;
  type: string;
  count?: number;
  description?: string;
}

export interface MediaSource {
  id: string;
  name: string;
  type: 'manga' | 'anime' | 'dual';
  language: string; // e.g. 'EN', 'JP', 'MULTI'
  icon: string;
  isPinned?: boolean;
  status: 'ONLINE' | 'MAINTENANCE' | 'SLOW';
  pingMs: number;
  itemCount: string; // e.g. '45,000+'
  description: string;
  filters?: SourceFilter[];
  categories?: string[];
}

export interface MediaItem {
  id: string;
  sourceTitleId?: string;
  title: string;
  japaneseTitle?: string;
  type: MediaType;
  sourceId?: string;
  coverImage: string;
  bannerImage: string;
  description: string;
  rating: number; // e.g. 4.9
  status: 'RELEASING' | 'FINISHED' | 'UPCOMING';
  genres: string[];
  trendingRank?: number;
  isEditorialSelection?: boolean;
  editorialExcerpt?: string;
  latestChapterOrEpisode: string;
  updatedAgo: string;
  progressPercent?: number;
  progressText?: string;
  chapters?: MangaChapter[];
  episodes?: AnimeEpisode[];
}

export interface UserProfile {
  id: string;
  username: string;
  handle: string;
  avatar: string;
  chaptersRead: number;
  hoursWatched: number;
  readingStreakDays: number;
  preferredReaderMode: 'single' | 'continuous';
  preferredStreamQuality: '1080p' | '720p' | 'auto';
}
