import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const urlParam = new URL(request.url).searchParams.get('url');

  if (!urlParam) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    // Sanitize host.docker.internal to localhost for internal fetch
    let targetUrl = urlParam.replace(/host\.docker\.internal/gi, 'localhost');

    const fetchRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!fetchRes.ok) {
      return new Response(`Failed to fetch image: ${fetchRes.status}`, { status: fetchRes.status });
    }

    const contentType = fetchRes.headers.get('content-type') || 'image/png';
    const buffer = await fetchRes.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (err: any) {
    console.error('[ImageProxy] Error proxying image:', err);
    return new Response(`Error proxying image: ${err.message}`, { status: 500 });
  }
};
