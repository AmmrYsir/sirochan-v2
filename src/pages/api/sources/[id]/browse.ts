import type { APIRoute } from 'astro';
import { ApiService } from '../../../../db/apiService';

export const POST: APIRoute = async ({ params, request }) => {
  const sourceId = params.id;
  if (!sourceId) {
    return new Response(JSON.stringify({ error: 'Source ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { query, page, filters } = body;
    const result = await ApiService.browseSource(sourceId, query, page || 1, filters || {});
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Error browsing source' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
