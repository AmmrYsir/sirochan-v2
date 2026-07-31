import { defineMiddleware } from 'astro:middleware';
import { AuthClient } from './lib/authClient';
import { db } from './db/client';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

export const onRequest = defineMiddleware(async (context, next) => {
  const token = context.cookies.get('sys_access_token')?.value;

  if (token) {
    try {
      const authUser = await AuthClient.getMe(token);
      if (authUser) {
        // Generate a clean handle based on name/email
        const handle = (authUser.name || authUser.email.split('@')[0] || 'user')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_');

        // Check if user already exists in PostgreSQL
        let localUser = await db.query.users.findFirst({
          where: eq(users.id, authUser.id)
        });

        if (!localUser) {
          // Upsert local user profile in PostgreSQL database
          const inserted = await db.insert(users).values({
            id: authUser.id,
            email: authUser.email,
            username: authUser.name || authUser.email.split('@')[0],
            handle: handle,
            avatar: authUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${authUser.id}`,
            chaptersRead: 0,
            hoursWatched: 0,
            readingStreakDays: 1,
            preferredReaderMode: 'continuous',
            preferredStreamQuality: '1080p',
            autoSkipIntro: true
          }).onConflictDoUpdate({
            target: users.id,
            set: {
              email: authUser.email,
              username: authUser.name || authUser.email.split('@')[0],
              updatedAt: new Date()
            }
          }).returning();

          localUser = inserted[0];
        }

        context.locals.user = localUser ? {
          id: localUser.id,
          email: localUser.email || undefined,
          username: localUser.username,
          handle: localUser.handle,
          avatar: localUser.avatar || undefined,
          chaptersRead: localUser.chaptersRead,
          hoursWatched: localUser.hoursWatched,
          readingStreakDays: localUser.readingStreakDays,
          preferredReaderMode: localUser.preferredReaderMode,
          preferredStreamQuality: localUser.preferredStreamQuality,
          autoSkipIntro: localUser.autoSkipIntro
        } : {
          id: authUser.id,
          email: authUser.email,
          username: authUser.name,
          handle: handle
        };
      } else {
        context.locals.user = null;
      }
    } catch (err) {
      console.error('[Middleware] Error fetching auth user or syncing with DB:', err);
      context.locals.user = null;
    }
  } else {
    context.locals.user = null;
  }

  return next();
});
