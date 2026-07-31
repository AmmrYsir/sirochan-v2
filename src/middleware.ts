import { defineMiddleware } from 'astro:middleware';
import { AuthClient } from './lib/authClient';
import { db } from './db/client';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;

  // 1. Immediately bypass static assets
  const isStaticAsset =
    pathname.startsWith('/_astro/') ||
    pathname.startsWith('/@fs/') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.woff2');

  if (isStaticAsset) {
    return next();
  }

  // 2. Extract session token from Cookie or Authorization Header
  const authHeader = context.request.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const cookieToken = context.cookies.get('sys_access_token')?.value;
  const token = bearerToken || cookieToken;

  let authenticatedUser = null;

  if (token) {
    try {
      // Validate session token against SushiGuard Auth (http://localhost:3000/api/v1/auth/me)
      const authUser = await AuthClient.getMe(token);
      if (authUser) {
        const handle = (authUser.name || authUser.email?.split('@')[0] || 'user')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_');

        // Set authenticated user immediately from authUser (guarantees auth success even if DB is offline)
        authenticatedUser = {
          id: authUser.id,
          email: authUser.email,
          username: authUser.name || authUser.email?.split('@')[0] || 'User',
          handle: handle,
          avatar: authUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${authUser.id}`,
          chaptersRead: 0,
          hoursWatched: 0,
          readingStreakDays: 1,
          preferredReaderMode: 'continuous',
          preferredStreamQuality: '1080p',
          autoSkipIntro: true
        };

        // Try syncing with PostgreSQL database in a safe non-fatal block
        try {
          let localUser = await db.query.users.findFirst({
            where: eq(users.id, authUser.id)
          });

          if (!localUser) {
            const inserted = await db.insert(users).values({
              id: authUser.id,
              email: authUser.email,
              username: authUser.name || authUser.email?.split('@')[0] || 'User',
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
                username: authUser.name || authUser.email?.split('@')[0] || 'User',
                updatedAt: new Date()
              }
            }).returning();

            localUser = inserted[0];
          }

          if (localUser) {
            authenticatedUser = {
              ...authenticatedUser,
              username: localUser.username || authenticatedUser.username,
              handle: localUser.handle || authenticatedUser.handle,
              avatar: localUser.avatar || authenticatedUser.avatar,
              chaptersRead: localUser.chaptersRead,
              hoursWatched: localUser.hoursWatched,
              readingStreakDays: localUser.readingStreakDays,
              preferredReaderMode: localUser.preferredReaderMode,
              preferredStreamQuality: localUser.preferredStreamQuality,
              autoSkipIntro: localUser.autoSkipIntro
            };
          }
        } catch (dbErr) {
          console.warn('[Middleware] Local DB profile sync notice (non-fatal):', dbErr);
        }
      }
    } catch (err) {
      console.error('[Middleware] Token validation error:', err);
    }
  }

  context.locals.user = authenticatedUser;

  // Public unauthenticated routes
  const isPublicRoute =
    pathname === '/login' ||
    pathname.startsWith('/api/auth/');

  // STRICT AUTHENTICATION GUARD
  if (!context.locals.user && !isPublicRoute) {
    if (pathname.startsWith('/api/')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Authentication required.', loginUrl: '/login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return context.redirect('/login');
  }

  // Redirect authenticated user away from login page to home
  if (context.locals.user && pathname === '/login') {
    return context.redirect('/');
  }

  return next();
});
