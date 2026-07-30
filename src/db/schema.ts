import { pgTable, text, integer, timestamp, varchar, boolean, real, primaryKey } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  username: varchar('username', { length: 100 }).notNull(),
  handle: varchar('handle', { length: 100 }).notNull().unique(),
  avatar: text('avatar'),
  chaptersRead: integer('chapters_read').default(0).notNull(),
  hoursWatched: integer('hours_watched').default(0).notNull(),
  readingStreakDays: integer('reading_streak_days').default(1).notNull(),
  preferredReaderMode: varchar('preferred_reader_mode', { length: 32 }).default('continuous').notNull(),
  preferredStreamQuality: varchar('preferred_stream_quality', { length: 16 }).default('1080p').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const media = pgTable('media', {
  id: varchar('id', { length: 128 }).primaryKey(),
  sourceId: varchar('source_id', { length: 64 }).notNull(),
  sourceTitleId: text('source_title_id').notNull(),
  title: text('title').notNull(),
  japaneseTitle: text('japanese_title'),
  type: varchar('type', { length: 16 }).notNull(), // 'manga' | 'anime'
  coverImage: text('cover_image'),
  bannerImage: text('banner_image'),
  description: text('description'),
  rating: real('rating').default(4.8),
  status: varchar('status', { length: 32 }).default('RELEASING'),
  genres: text('genres').array(),
  totalChapters: integer('total_chapters'),
  totalEpisodes: integer('total_episodes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const userProgress = pgTable('user_progress', {
  id: varchar('id', { length: 128 }).primaryKey(),
  userId: varchar('user_id', { length: 64 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  mediaId: varchar('media_id', { length: 128 }).notNull().references(() => media.id, { onDelete: 'cascade' }),
  contentType: varchar('content_type', { length: 16 }).notNull(), // 'chapter' | 'episode'
  contentId: varchar('content_id', { length: 128 }).notNull(),
  contentNumber: integer('content_number').notNull(),
  progressPercent: integer('progress_percent').default(0).notNull(),
  timeMarkerSeconds: integer('time_marker_seconds').default(0),
  lastReadOrWatchedAt: timestamp('last_read_or_watched_at').defaultNow().notNull()
});

export const bookmarks = pgTable('bookmarks', {
  userId: varchar('user_id', { length: 64 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  mediaId: varchar('media_id', { length: 128 }).notNull().references(() => media.id, { onDelete: 'cascade' }),
  folder: varchar('folder', { length: 32 }).default('bookmarks').notNull(), // 'in_progress' | 'bookmarks' | 'favorites'
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => [
  primaryKey({ columns: [table.userId, table.mediaId] })
]);
