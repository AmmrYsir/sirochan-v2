import type { APIRoute } from 'astro';
import { cleanImageUrl } from '../../../utils/thumbnailCache';

export const GET: APIRoute = async ({ request }) => {
	let urlParam = new URL(request.url).searchParams.get('url');

	if (!urlParam) {
		return new Response('Missing url parameter', { status: 400 });
	}

	urlParam = cleanImageUrl(urlParam);

	// Detect LOOUWD_URL from process environment
	const loouwdBase = process.env.LOOUWD_URL || (import.meta as any).env?.LOOUWD_URL;

	// Construct candidate URLs to try fetching
	const candidateUrls: string[] = [];

	// 1. As provided in parameter
	candidateUrls.push(urlParam);

	// 2. Swapped host.docker.internal -> localhost
	if (urlParam.includes('host.docker.internal')) {
		candidateUrls.push(urlParam.replace(/host\.docker\.internal/gi, 'localhost'));
	}

	// 3. Swapped localhost -> host.docker.internal
	if (urlParam.includes('localhost')) {
		candidateUrls.push(urlParam.replace(/localhost/gi, 'host.docker.internal'));
	}

	// 4. Using configured LOOUWD_URL environment base
	try {
		const parsed = new URL(urlParam);
		candidateUrls.push(`${loouwdBase}${parsed.pathname}${parsed.search}`);
	} catch (e) {
		if (urlParam.startsWith('/')) {
			candidateUrls.push(`${loouwdBase}${urlParam}`);
		}
	}

	let lastError: any = null;

	// Try candidate URLs until one succeeds
	for (const targetUrl of candidateUrls) {
		try {
			let referer = 'https://nhentai.net/';
			try {
				if (targetUrl.startsWith('http')) {
					referer = `${new URL(targetUrl).origin}/`;
				}
			} catch (e) {}

			const fetchRes = await fetch(targetUrl, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
					'Referer': referer
				},
				signal: AbortSignal.timeout(4000)
			});

			if (fetchRes.ok) {
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
			}
		} catch (err: any) {
			lastError = err;
		}
	}

	console.error('[ImageProxy] Error proxying image across candidate URLs:', candidateUrls, lastError);
	return new Response(`Error proxying image: ${lastError?.message || 'Could not reach media service'}`, { status: 500 });
};
