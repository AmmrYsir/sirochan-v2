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

  // 2. Extract session tokens from Cookie or Authorization Header
  const authHeader = context.request.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const cookieAccessToken = context.cookies.get('sys_access_token')?.value;
  const cookieRefreshToken = context.cookies.get('sys_refresh_token')?.value;
  let token = bearerToken || cookieAccessToken;

  let authenticatedUser = null;
  let authUser: any = null;

  if (token) {
    try {
      // Validate access token against Auth service (http://localhost:3000/api/v1/auth/me)
      authUser = await AuthClient.getMe(token);
    } catch (err) {
      console.error('[Middleware] Access token validation error:', err);
    }
  }

  // 3. Auto-refresh token if access token is invalid/expired but refresh token exists
  if (!authUser && cookieRefreshToken) {
    try {
      const refreshResult = await AuthClient.refreshToken(cookieRefreshToken);
      if (refreshResult.token) {
        token = refreshResult.token;
        context.cookies.set('sys_access_token', refreshResult.token, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: false,
          maxAge: 60 * 60 * 24 * 7
        });

        if (refreshResult.refreshToken) {
          context.cookies.set('sys_refresh_token', refreshResult.refreshToken, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            maxAge: 60 * 60 * 24 * 7
          });
        }

        authUser = refreshResult.user || (await AuthClient.getMe(refreshResult.token));
      } else {
        // Refresh failed (e.g. 7 days limit exceeded) - clear cookies
        context.cookies.delete('sys_access_token', { path: '/' });
        context.cookies.delete('sys_refresh_token', { path: '/' });
      }
    } catch (refreshErr) {
      console.error('[Middleware] Auto refresh error:', refreshErr);
      context.cookies.delete('sys_access_token', { path: '/' });
      context.cookies.delete('sys_refresh_token', { path: '/' });
    }
  }

  if (authUser) {
    try {
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
            username: authUser.name || authUser.email?.split('@')[0] || 'User',
            handle: handle,
            avatar: authUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${authUser.id}`,
            chaptersRead: 0,
            hoursWatched: 0,
            readingStreakDays: 1,
            preferredReaderMode: 'continuous',
            preferredStreamQuality: '1080p'
          }).onConflictDoUpdate({
            target: users.id,
            set: {
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
            preferredStreamQuality: localUser.preferredStreamQuality
          };
        }
      } catch (dbErr) {
        console.warn('[Middleware] Local DB profile sync notice (non-fatal):', dbErr);
      }
    } catch (err) {
      console.error('[Middleware] Profile mapping error:', err);
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
