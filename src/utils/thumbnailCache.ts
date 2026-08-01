import fs from 'node:fs';
import path from 'node:path';

/**
 * Clean duplicate file extensions returned by some adapters (e.g. cover.webp.webp -> cover.webp)
 */
export function cleanImageUrl(url: string): string {
  if (!url) return '';
  return url
    .replace(/\.webp\.webp$/gi, '.webp')
    .replace(/\.jpg\.jpg$/gi, '.jpg')
    .replace(/\.png\.png$/gi, '.png')
    .replace(/\.jpeg\.jpeg$/gi, '.jpeg');
}

/**
 * Downloads a remote cover image binary and saves it locally to ./public/cache/covers/[mediaId].jpg
 * Returns the local static web path (e.g. /cache/covers/mangadex_c74d6f8a.jpg).
 */
export async function cacheThumbnailLocally(mediaId: string, remoteUrl?: string | null): Promise<string> {
  if (!remoteUrl || remoteUrl.trim() === '' || remoteUrl.startsWith('data:')) {
    return '';
  }

  // If already a local cached path, return as-is
  if (remoteUrl.startsWith('/cache/covers/')) {
    return remoteUrl;
  }

  try {
    const safeMediaId = mediaId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cacheDir = path.join(process.cwd(), 'public', 'cache', 'covers');

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const localFileName = `${safeMediaId}.jpg`;
    const localFilePath = path.join(cacheDir, localFileName);
    const publicWebPath = `/cache/covers/${localFileName}`;

    // Clean duplicate extensions
    let fetchUrl = cleanImageUrl(remoteUrl);

    // Normalize Docker hostnames if needed
    fetchUrl = fetchUrl.replace(/host\.docker\.internal/gi, 'localhost');
    
    // Handle proxied URLs
    if (fetchUrl.includes('/api/proxy/image?url=')) {
      const parts = fetchUrl.split('/api/proxy/image?url=');
      if (parts[1]) {
        fetchUrl = decodeURIComponent(parts[1]);
      }
    }

    if (fetchUrl.startsWith('data:')) {
      return '';
    }

    // Determine domain origin for Referer header
    let referer = 'https://nhentai.net/';
    try {
      if (fetchUrl.startsWith('http')) {
        referer = `${new URL(fetchUrl).origin}/`;
      }
    } catch (e) {}

    const res = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': referer
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) {
      console.warn(`[ThumbnailCache] Failed to download remote thumbnail (${res.status}): ${fetchUrl}`);
      return `/api/proxy/image?url=${encodeURIComponent(fetchUrl)}`;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 100) {
      console.warn(`[ThumbnailCache] Downloaded thumbnail too small (${buffer.length} bytes): ${fetchUrl}`);
      return `/api/proxy/image?url=${encodeURIComponent(fetchUrl)}`;
    }

    fs.writeFileSync(localFilePath, buffer);
    console.log(`[ThumbnailCache] Successfully saved local thumbnail: ${publicWebPath} (${buffer.length} bytes)`);
    return publicWebPath;
  } catch (err: any) {
    console.error(`[ThumbnailCache] Error caching thumbnail for ${mediaId}:`, err?.message || err);
    return `/api/proxy/image?url=${encodeURIComponent(remoteUrl)}`;
  }
}
