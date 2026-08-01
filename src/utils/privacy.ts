/**
 * Sirochan v2 — Privacy Protection & URL Obfuscation Utility
 * Encodes media titles, source IDs, and chapter/episode markers into short, opaque URL tokens.
 * Address bars, browser history, and network logs reveal zero readable text.
 */

const SECRET_KEY = 0x5a; // XOR scramble byte

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const scrambled = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    scrambled[i] = bytes[i] ^ SECRET_KEY;
  }
  let binary = '';
  for (let i = 0; i < scrambled.length; i++) {
    binary += String.fromCharCode(scrambled[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i) ^ SECRET_KEY;
    }
    return new TextDecoder().decode(bytes);
  } catch (err) {
    return '';
  }
}

export interface PrivacyPayload {
  sourceId: string;
  titleId: string;
  contentId?: string;
}

/**
 * Encodes media sourceId, titleId, and optional contentId into an opaque token
 */
export function encodePrivacySlug(sourceId: string, titleId: string, contentId?: string): string {
  const payload: PrivacyPayload = {
    sourceId: sourceId || 'mangadex',
    titleId: titleId || 'title',
    contentId: contentId || undefined
  };
  const jsonStr = JSON.stringify(payload);
  return base64UrlEncode(jsonStr);
}

/**
 * Decodes an opaque token back into sourceId, titleId, and contentId
 */
export function decodePrivacySlug(token: string): PrivacyPayload {
  if (!token) {
    return { sourceId: 'mangadex', titleId: 'title' };
  }
  const decodedStr = base64UrlDecode(token);
  if (decodedStr) {
    try {
      const parsed = JSON.parse(decodedStr);
      if (parsed && parsed.sourceId && parsed.titleId) {
        return {
          sourceId: parsed.sourceId,
          titleId: parsed.titleId,
          contentId: parsed.contentId || undefined
        };
      }
    } catch (e) {
      // Fallback for raw string or legacy tokens
    }
  }

  // Fallback if raw token was passed
  const parts = token.split(':');
  if (parts.length >= 2) {
    return {
      sourceId: parts[0],
      titleId: parts[1],
      contentId: parts[2] || undefined
    };
  }

  return { sourceId: 'mangadex', titleId: token };
}

/**
 * Helper to generate privacy URL for Media Detail view
 */
export function getPrivacyTitleUrl(item: { sourceId?: string; sourceTitleId?: string; id?: string }): string {
  const srcId = item.sourceId || 'mangadex';
  const titleId = item.sourceTitleId || item.id || 'title';
  const token = encodePrivacySlug(srcId, titleId);
  return `/v/${token}`;
}

/**
 * Helper to generate privacy URL for Reader view (manga)
 */
export function getPrivacyReaderUrl(item: { sourceId?: string; sourceTitleId?: string; id?: string }, contentId?: string): string {
  const srcId = item.sourceId || 'mangadex';
  const titleId = item.sourceTitleId || item.id || 'title';
  const token = encodePrivacySlug(srcId, titleId, contentId);
  return `/read/${token}`;
}

/**
 * Helper to generate privacy URL for Player view (anime)
 */
export function getPrivacyPlayerUrl(item: { sourceId?: string; sourceTitleId?: string; id?: string }, contentId?: string): string {
  const srcId = item.sourceId || 'hianime';
  const titleId = item.sourceTitleId || item.id || 'title';
  const token = encodePrivacySlug(srcId, titleId, contentId);
  return `/watch/${token}`;
}
