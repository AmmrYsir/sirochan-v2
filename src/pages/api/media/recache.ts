import type { APIRoute } from 'astro';
import { db } from '../../../db/client';
import { media } from '../../../db/schema';
import { ApiService } from '../../../db/apiService';
import { cacheThumbnailLocally } from '../../../utils/thumbnailCache';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { mediaId, sourceId, sourceTitleId } = body;

    if (!mediaId || !sourceId || !sourceTitleId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch fresh title details directly from microservice (bypassing in-memory cache if possible)
    const freshDetails = await ApiService.getTitleDetails(sourceId, sourceTitleId);

    if (!freshDetails) {
      return new Response(JSON.stringify({ error: 'Could not fetch fresh metadata from provider adapter.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Download/update local cover image binary
    const localCoverPath = await cacheThumbnailLocally(mediaId, freshDetails.thumbnailUrl);

    // Upsert fresh metadata into PostgreSQL
    await db.insert(media).values({
      id: mediaId,
      sourceId,
      sourceTitleId,
      title: freshDetails.title,
      japaneseTitle: freshDetails.altTitles?.[0] || freshDetails.title,
      type: freshDetails.mediaType || 'manga',
      coverImage: localCoverPath || freshDetails.thumbnailUrl || null,
      bannerImage: freshDetails.thumbnailUrl || null,
      description: freshDetails.description ? freshDetails.description.replace(/<[^>]*>/g, '') : null,
      rating: freshDetails.rating ? parseFloat(freshDetails.rating.toString()) : 4.8,
      status: freshDetails.status ? freshDetails.status.toUpperCase() : 'RELEASING',
      genres: freshDetails.tags?.length ? freshDetails.tags : [],
      totalChapters: freshDetails.totalChapters || null,
      totalEpisodes: freshDetails.totalEpisodes || null,
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: media.id,
      set: {
        title: freshDetails.title,
        japaneseTitle: freshDetails.altTitles?.[0] || freshDetails.title,
        coverImage: localCoverPath || freshDetails.thumbnailUrl || null,
        bannerImage: freshDetails.thumbnailUrl || null,
        description: freshDetails.description ? freshDetails.description.replace(/<[^>]*>/g, '') : null,
        rating: freshDetails.rating ? parseFloat(freshDetails.rating.toString()) : 4.8,
        genres: freshDetails.tags?.length ? freshDetails.tags : [],
        totalChapters: freshDetails.totalChapters || null,
        totalEpisodes: freshDetails.totalEpisodes || null,
        updatedAt: new Date()
      }
    });

    console.log(`[ReCache API] Successfully re-cached metadata & local thumbnail for ${mediaId}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Metadata and local thumbnail successfully updated!',
      media: {
        id: mediaId,
        title: freshDetails.title,
        coverImage: localCoverPath || freshDetails.thumbnailUrl,
        rating: freshDetails.rating || 4.8,
        genres: freshDetails.tags || []
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('[ReCache API] Error re-caching media:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
