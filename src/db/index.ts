import { db } from './client';
import { users, media } from './schema';
import { eq } from 'drizzle-orm';
import type { MediaItem, UserProfile } from '../types';

/**
 * Type-safe Database Data Access Layer
 * Directly queries PostgreSQL sirochan_db tables.
 */
export async function getMediaList(filter?: { type?: 'manga' | 'anime'; genre?: string; query?: string }): Promise<MediaItem[]> {
  const allMedia = await db.query.media.findMany();

  let list: MediaItem[] = allMedia.map(m => ({
    id: m.sourceTitleId || m.id,
    sourceId: m.sourceId,
    sourceTitleId: m.sourceTitleId || m.id,
    title: m.title,
    japaneseTitle: m.japaneseTitle || m.title,
    type: m.type as 'manga' | 'anime',
    coverImage: m.coverImage || '',
    bannerImage: m.bannerImage || '',
    description: m.description || '',
    rating: m.rating || 4.8,
    status: (m.status || 'RELEASING') as any,
    genres: m.genres || [],
    latestChapterOrEpisode: m.type === 'anime' ? `EP. ${m.totalEpisodes || 12}` : `CH. ${m.totalChapters || 100}`,
    updatedAgo: 'LIVE'
  }));

  if (filter?.type) {
    list = list.filter(m => m.type === filter.type);
  }

  if (filter?.genre && filter.genre !== 'All') {
    list = list.filter(m => m.genres.includes(filter.genre!));
  }

  if (filter?.query) {
    const q = filter.query.toLowerCase();
    list = list.filter(m => 
      m.title.toLowerCase().includes(q) || 
      (m.description && m.description.toLowerCase().includes(q)) ||
      m.genres.some(g => g.toLowerCase().includes(q))
    );
  }

  return list;
}

export async function getMediaById(id: string): Promise<MediaItem | undefined> {
  const m = await db.query.media.findFirst({
    where: eq(media.id, id)
  });
  if (!m) return undefined;

  return {
    id: m.sourceTitleId || m.id,
    sourceId: m.sourceId,
    sourceTitleId: m.sourceTitleId || m.id,
    title: m.title,
    japaneseTitle: m.japaneseTitle || m.title,
    type: m.type as 'manga' | 'anime',
    coverImage: m.coverImage || '',
    bannerImage: m.bannerImage || '',
    description: m.description || '',
    rating: m.rating || 4.8,
    status: (m.status || 'RELEASING') as any,
    genres: m.genres || [],
    latestChapterOrEpisode: m.type === 'anime' ? `EP. ${m.totalEpisodes || 12}` : `CH. ${m.totalChapters || 100}`,
    updatedAgo: 'LIVE'
  };
}

export async function getUserProfile(id: string): Promise<UserProfile | null> {
  const u = await db.query.users.findFirst({
    where: eq(users.id, id)
  });
  if (!u) return null;

  return {
    id: u.id,
    username: u.username,
    handle: u.handle || `@${u.username.toLowerCase()}`,
    avatar: u.avatar || '',
    chaptersRead: u.chaptersRead || 0,
    hoursWatched: u.hoursWatched || 0,
    readingStreakDays: u.readingStreakDays || 1,
    preferredReaderMode: (u.preferredReaderMode || 'continuous') as any,
    preferredStreamQuality: (u.preferredStreamQuality || '1080p') as any
  };
}
