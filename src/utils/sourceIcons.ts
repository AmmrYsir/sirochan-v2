/**
 * Curated high-resolution brand icons and fallback indicators for media source providers.
 * Completely eliminates 404 network errors caused by missing Loouwd static icon files.
 */

export interface SourceBrandStyle {
  icon: string;
  badgeBg: string;
  badgeColor: string;
  brandName: string;
}

export const SOURCE_BRAND_MAP: Record<string, SourceBrandStyle> = {
  mangadex: {
    icon: '📚',
    badgeBg: 'rgba(230, 57, 70, 0.15)',
    badgeColor: '#E63946',
    brandName: 'MangaDex'
  },
  spankbang: {
    icon: '💥',
    badgeBg: 'rgba(244, 162, 97, 0.15)',
    badgeColor: '#F4A261',
    brandName: 'SpankBang'
  },
  omegascans: {
    icon: '⚡',
    badgeBg: 'rgba(46, 196, 182, 0.15)',
    badgeColor: '#2EC4B6',
    brandName: 'OmegaScans'
  },
  nhentai: {
    icon: '🌸',
    badgeBg: 'rgba(237, 106, 94, 0.15)',
    badgeColor: '#ED6A5E',
    brandName: 'nHentai'
  },
  rule34world: {
    icon: '🎨',
    badgeBg: 'rgba(155, 93, 229, 0.15)',
    badgeColor: '#9B5DE5',
    brandName: 'Rule34World'
  },
  xvideos: {
    icon: '🎬',
    badgeBg: 'rgba(224, 86, 36, 0.15)',
    badgeColor: '#E05624',
    brandName: 'XVideos'
  },
  xhamster: {
    icon: '🐹',
    badgeBg: 'rgba(241, 91, 181, 0.15)',
    badgeColor: '#F15BB5',
    brandName: 'xHamster'
  },
  eporner: {
    icon: '🔥',
    badgeBg: 'rgba(247, 37, 133, 0.15)',
    badgeColor: '#F72585',
    brandName: 'EPorner'
  },
  hentai20: {
    icon: '✨',
    badgeBg: 'rgba(72, 149, 239, 0.15)',
    badgeColor: '#4895EF',
    brandName: 'Hentai20'
  }
};

export function getSourceBrand(sourceId: string, defaultType: string = 'manga'): SourceBrandStyle {
  const cleanId = (sourceId || '').toLowerCase().trim();
  if (SOURCE_BRAND_MAP[cleanId]) {
    return SOURCE_BRAND_MAP[cleanId];
  }
  return {
    icon: defaultType === 'manga' ? '📚' : '⚡',
    badgeBg: 'rgba(230, 57, 70, 0.15)',
    badgeColor: '#E63946',
    brandName: sourceId || 'Source'
  };
}
