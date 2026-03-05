/**
 * Generate SVG badge images based on badge properties
 */

function generateBadgeSVG(badge) {
  const { icon, tier, category, name } = badge;
  
  // Tier colors
  const tierColors = {
    bronze: { primary: '#cd7f32', secondary: '#8b5a2b', light: '#d4a574' },
    silver: { primary: '#c0c0c0', secondary: '#a0a0a0', light: '#e0e0e0' },
    gold: { primary: '#ffd700', secondary: '#ffb700', light: '#fff8dc' },
    platinum: { primary: '#e5e4e2', secondary: '#c0c0c0', light: '#f5f5f5' },
    diamond: { primary: '#b9f2ff', secondary: '#87ceeb', light: '#e0f7ff' },
    legendary: { primary: '#ff6b6b', secondary: '#ff4757', light: '#ffcccc' }
  };

  const colors = tierColors[tier] || tierColors.bronze;
  
  // Category icons/patterns
  const categoryPatterns = {
    upvotes: '👍',
    posts: '📝',
    rewards: '🎁',
    tokens: '🪙',
    quality: '⭐',
    special: '🌟'
  };

  const categoryIcon = categoryPatterns[category] || '⭐';

  // Generate SVG with unique IDs to avoid conflicts
  const uniqueId = `${tier}-${category}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Use the icon emoji directly in the SVG
  const badgeIcon = icon || categoryIcon;
  
  const svg = `<svg width="120" height="120" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<defs>
<linearGradient id="grad${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
<stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
</linearGradient>
<filter id="shadow${uniqueId}">
<feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
</filter>
</defs>
<circle cx="60" cy="60" r="55" fill="url(#grad${uniqueId})" filter="url(#shadow${uniqueId})"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="${colors.light}" stroke-width="2" opacity="0.5"/>
<circle cx="60" cy="60" r="42" fill="none" stroke="${colors.secondary}" stroke-width="1.5" opacity="0.6"/>
<foreignObject x="20" y="20" width="80" height="80">
<body xmlns="http://www.w3.org/1999/xhtml" style="margin:0;padding:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:50px;">${badgeIcon}</body>
</foreignObject>
<rect x="25" y="95" width="70" height="18" rx="9" fill="${colors.secondary}" opacity="0.8"/>
<text x="60" y="107" font-family="Arial, sans-serif" font-size="10" font-weight="bold" text-anchor="middle" fill="#000" opacity="0.9">${tier.toUpperCase()}</text>
</svg>`;

  // URL encode the SVG for data URL (properly encode all special characters)
  const encodedSvg = encodeURIComponent(svg);
  return `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
}

/**
 * Generate a simple badge image URL (can be used for caching)
 */
function getBadgeImageUrl(badge) {
  try {
    // For now, return the SVG data URL
    // In production, you might want to cache these or use a CDN
    const imageUrl = generateBadgeSVG(badge);
    if (!imageUrl || !imageUrl.startsWith('data:image/svg+xml')) {
      console.error('Invalid badge image URL generated for:', badge.name);
      return null;
    }
    return imageUrl;
  } catch (error) {
    console.error('Error generating badge image for:', badge.name, error);
    return null;
  }
}

module.exports = {
  generateBadgeSVG,
  getBadgeImageUrl
};
