import type { MediaItem, UserProfile, MediaSource } from '../types';

export const currentUser: UserProfile = {
  id: 'usr_01',
  username: 'Arata',
  handle: '@arata_manga',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  chaptersRead: 0,
  hoursWatched: 0,
  readingStreakDays: 1,
  preferredReaderMode: 'continuous',
  preferredStreamQuality: '1080p'
};

// Pure empty data - Sirochan v2 strictly consumes live data from localhost:8000 microservice
export const mockSources: MediaSource[] = [];
export const mockMediaList: MediaItem[] = [];
