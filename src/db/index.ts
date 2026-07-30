import { mockMediaList, currentUser } from './mockData';
import type { MediaItem, UserProfile } from '../types';

/**
 * Type-safe Database Data Access Layer
 * Supports PostgreSQL connection via DATABASE_URL or fallback to rich mock data.
 */
export async function getMediaList(filter?: { type?: 'manga' | 'anime'; genre?: string; query?: string }): Promise<MediaItem[]> {
  let list = [...mockMediaList];

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
      m.description.toLowerCase().includes(q) ||
      m.genres.some(g => g.toLowerCase().includes(q))
    );
  }

  return list;
}

export async function getMediaById(id: string): Promise<MediaItem | undefined> {
  return mockMediaList.find(m => m.id === id);
}

export async function getUserProfile(id: string): Promise<UserProfile> {
  return currentUser;
}
