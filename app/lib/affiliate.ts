/**
 * Affiliate link processing
 * 
 * Format: [affiliate:title:url:description]
 * Example: [affiliate:おすすめの本:https://amazon.co.jp/dp/xxx:とても良い本です]
 */

export interface AffiliateData {
  title: string;
  url: string;
  description: string;
}

/**
 * Parse affiliate shortcode from content
 */
export function parseAffiliateShortcode(shortcode: string): AffiliateData | null {
  const match = shortcode.match(/\[affiliate:([^:]+):([^:]+):([^\]]+)\]/);
  if (!match) return null;

  return {
    title: match[1].trim(),
    url: match[2].trim(),
    description: match[3].trim(),
  };
}

/**
 * Replace affiliate shortcodes with styled HTML cards
 */
export function processAffiliateLinks(content: string, affiliateId?: string): string {
  // Match all affiliate shortcodes
  const regex = /\[affiliate:([^:]+):([^:]+):([^\]]+)\]/g;

  return content.replace(regex, (match, title, url, description) => {
    // Add affiliate ID to URL if provided
    let finalUrl = url.trim();
    if (affiliateId && url.includes("amazon")) {
      // Amazon affiliate link format
      const separator = url.includes("?") ? "&" : "?";
      finalUrl = `${url}${separator}tag=${affiliateId}`;
    }

    return `
<aside class="affiliate-card">
  <p class="affiliate-card__eyebrow">そっと置いておくメモ</p>
  <h3 class="affiliate-card__title">${title.trim()}</h3>
  <p class="affiliate-card__desc">${description.trim()}</p>
  <a href="${finalUrl}" rel="nofollow sponsored noopener" target="_blank" class="affiliate-card__link">
    詳しく見る
  </a>
</aside>
    `.trim();
  });
}

/**
 * Extract all affiliate data from content (for preview or analysis)
 */
export function extractAffiliates(content: string): AffiliateData[] {
  const affiliates: AffiliateData[] = [];
  const regex = /\[affiliate:([^:]+):([^:]+):([^\]]+)\]/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    affiliates.push({
      title: match[1].trim(),
      url: match[2].trim(),
      description: match[3].trim(),
    });
  }

  return affiliates;
}

/**
 * Strip affiliate shortcodes from content (for excerpt generation)
 */
export function stripAffiliateShortcodes(content: string): string {
  return content.replace(/\[affiliate:[^\]]+\]/g, "").trim();
}
