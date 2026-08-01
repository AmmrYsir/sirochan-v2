import type { APIRoute } from 'astro';
import { db } from '../../../db/client';
import { userProgress, media } from '../../../db/schema';
import { cacheThumbnailLocally } from '../../../utils/thumbnailCache';
import { ApiService } from '../../../db/apiService';

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
      type, // 'manga' | 'anime'
      coverImage,
      bannerImage,
      description,
      rating,
      genres,
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

    // Resolve real remote cover URL if client passed data URI
    let realRemoteCover = coverImage;
    if ((!realRemoteCover || realRemoteCover.startsWith('data:')) && sourceId && (sourceTitleId || mediaId)) {
      const targetTitleId = sourceTitleId || (mediaId.includes(':') ? mediaId.split(':')[1] : mediaId);
      const live = await ApiService.getTitleDetails(sourceId, targetTitleId);
      if (live?.thumbnailUrl) {
        realRemoteCover = live.thumbnailUrl;
      }
    }

    // Cache cover thumbnail locally if available
    const localCoverPath = realRemoteCover ? await cacheThumbnailLocally(mediaId, realRemoteCover) : null;

    // Upsert full media metadata into PostgreSQL
    if (sourceId && title) {
      await db.insert(media).values({
        id: mediaId,
        sourceId,
        sourceTitleId: sourceTitleId || mediaId,
        title,
        japaneseTitle: japaneseTitle || null,
        type: type || (contentType === 'chapter' ? 'manga' : 'anime'),
        coverImage: localCoverPath || coverImage || null,
        bannerImage: bannerImage || null,
        description: description || null,
        rating: rating ? parseFloat(rating) : 4.8,
        status: 'RELEASING',
        genres: Array.isArray(genres) ? genres : [],
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: media.id,
        set: {
          title,
          coverImage: localCoverPath || coverImage || undefined,
          bannerImage: bannerImage ? bannerImage : undefined,
          description: description ? description : undefined,
          genres: Array.isArray(genres) && genres.length > 0 ? genres : undefined,
          updatedAt: new Date()
        }
      });
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

    return new Response(JSON.stringify({ success: true, coverImage: localCoverPath }), {
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
