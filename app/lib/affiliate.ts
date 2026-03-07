import { marked } from "marked";

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

// Custom renderer for images
const renderer = new marked.Renderer();
renderer.image = (href: string, title: string | null, text: string) => {
  const alt = text || "";
  const titleAttr = title ? ` title="${title}"` : "";
  return `<img src="${href}" alt="${alt}"${titleAttr} class="article-image" loading="lazy" />`;
};

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
  renderer: renderer,
});

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
 * Process affiliate links and convert to HTML cards
 */
function processAffiliateLinksInternal(content: string, affiliateId?: string): string {
  const regex = /\[affiliate:([^:]+):([^:]+):([^\]]+)\]/g;

  return content.replace(regex, (match, title, url, description) => {
    let finalUrl = url.trim();
    if (affiliateId && url.includes("amazon")) {
      const separator = url.includes("?") ? "&" : "?";
      finalUrl = `${url}${separator}tag=${affiliateId}`;
    }

    // Return a placeholder that won't be affected by markdown parsing
    return `\n\n<div class="affiliate-card">
  <p class="affiliate-card__eyebrow">そっと置いておくメモ</p>
  <h3 class="affiliate-card__title">${title.trim()}</h3>
  <p class="affiliate-card__desc">${description.trim()}</p>
  <a href="${finalUrl}" rel="nofollow sponsored noopener" target="_blank" class="affiliate-card__link">
    詳しく見る
  </a>
</div>\n\n`;
  });
}

/**
 * Process content: Markdown → HTML + Affiliate cards
 */
export function processAffiliateLinks(content: string, affiliateId?: string): string {
  // First, process affiliate links
  let processed = processAffiliateLinksInternal(content, affiliateId);
  
  // Then convert Markdown to HTML
  processed = marked.parse(processed) as string;
  
  return processed;
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
