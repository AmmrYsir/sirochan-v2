import type { APIRoute } from 'astro';
import { db } from '../../../db/client';
import { userProgress, media } from '../../../db/schema';
import { eq } from 'drizzle-orm';

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
      type, // 'manga' | 'anime'
      contentType, // 'chapter' | 'episode'
      contentId,
      contentNumber,
      timeMarkerSeconds = 0,
      progressPercent = 0
    } = body;

    if (!mediaId || !contentType || !contentId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Ensure media entry exists in DB cache
    const existingMedia = await db.query.media.findFirst({
      where: eq(media.id, mediaId)
    });

    if (!existingMedia && sourceId && title) {
      await db.insert(media).values({
        id: mediaId,
        sourceId,
        sourceTitleId: sourceTitleId || mediaId,
        title,
        type: type || (contentType === 'chapter' ? 'manga' : 'anime'),
        status: 'RELEASING'
      }).onConflictDoNothing();
    }

    // Upsert user progress
    const progressId = `${locals.user.id}:${mediaId}`;
    
    await db.insert(userProgress).values({
      id: progressId,
      userId: locals.user.id,
      mediaId,
      contentType,
      contentId,
      contentNumber: contentNumber || 1,
      timeMarkerSeconds,
      progressPercent,
      lastReadOrWatchedAt: new Date()
    }).onConflictDoUpdate({
      target: userProgress.id,
      set: {
        contentType,
        contentId,
        contentNumber: contentNumber || 1,
        timeMarkerSeconds,
        progressPercent,
        lastReadOrWatchedAt: new Date()
      }
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('[Progress API] Error updating progress:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
