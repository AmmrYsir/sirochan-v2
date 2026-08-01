import type { APIRoute } from 'astro';
import { db } from '../../../db/client';
import { bookmarks, media } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const {
      mediaId,
      sourceId,
      sourceTitleId,
      title,
      japaneseTitle,
      type,
      coverImage,
      bannerImage,
      description,
      rating,
      status,
      genres,
      totalChapters,
      totalEpisodes,
      folder = 'bookmarks',
      action = 'add' // 'add' | 'remove'
    } = body;

    if (!mediaId) {
      return new Response(JSON.stringify({ error: 'Media ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'remove') {
      await db.delete(bookmarks).where(
        and(
          eq(bookmarks.userId, locals.user.id),
          eq(bookmarks.mediaId, mediaId)
        )
      );
      return new Response(JSON.stringify({ success: true, isBookmarked: false }), { status: 200 });
    }

    // Upsert full media metadata into PostgreSQL
    if (sourceId && title) {
      await db.insert(media).values({
        id: mediaId,
        sourceId,
        sourceTitleId: sourceTitleId || mediaId,
        title,
        japaneseTitle: japaneseTitle || null,
        type: type || 'manga',
        coverImage: coverImage || null,
        bannerImage: bannerImage || null,
        description: description || null,
        rating: rating ? parseFloat(rating) : 4.8,
        status: status || 'RELEASING',
        genres: Array.isArray(genres) ? genres : [],
        totalChapters: totalChapters ? parseInt(totalChapters) : null,
        totalEpisodes: totalEpisodes ? parseInt(totalEpisodes) : null,
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: media.id,
        set: {
          title,
          japaneseTitle: japaneseTitle || null,
          coverImage: coverImage || null,
          bannerImage: bannerImage || null,
          description: description || null,
          rating: rating ? parseFloat(rating) : 4.8,
          genres: Array.isArray(genres) ? genres : [],
          totalChapters: totalChapters ? parseInt(totalChapters) : null,
          totalEpisodes: totalEpisodes ? parseInt(totalEpisodes) : null,
          updatedAt: new Date()
        }
      });
    }

    // Upsert user bookmark
    await db.insert(bookmarks).values({
      userId: locals.user.id,
      mediaId,
      folder
    }).onConflictDoUpdate({
      target: [bookmarks.userId, bookmarks.mediaId],
      set: {
        folder
      }
    });

    return new Response(JSON.stringify({ success: true, isBookmarked: true, folder }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('[Bookmark API] Error updating bookmark:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
