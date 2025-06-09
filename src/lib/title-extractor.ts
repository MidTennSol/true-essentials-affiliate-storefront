/**
 * Extract and clean product titles from various sources
 */

/**
 * Extract title from Amazon URL by trying to get it from the URL path
 */
export function extractTitleFromUrl(amazonUrl: string): string | null {
  try {
    const url = new URL(amazonUrl);
    const pathParts = url.pathname.split('/');
    
    // Look for product name in URL path (usually before /dp/)
    for (let i = 0; i < pathParts.length; i++) {
      if (pathParts[i] === 'dp' && i > 0) {
        const potentialTitle = pathParts[i - 1];
        if (potentialTitle && potentialTitle.length > 5) {
          // Convert URL-encoded title back to readable format
          const decodedTitle = decodeURIComponent(potentialTitle)
            .replace(/-+/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase()) // Title Case
            .trim();
          
          if (decodedTitle.length > 10) {
            return decodedTitle;
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Error extracting title from URL:', error);
    return null;
  }
}

/**
 * Create smart product titles based on available information
 */
export function createSmartTitle(asin: string, amazonUrl?: string, existingTitle?: string): string {
  // Try different sources in order of preference
  
  // 1. Use existing title if provided and clean
  if (existingTitle && existingTitle.trim().length > 5) {
    const cleaned = cleanTitle(existingTitle);
    if (cleaned.length > 5) {
      return truncateWithEllipsis(cleaned, 50);
    }
  }
  
  // 2. Try to extract from URL
  if (amazonUrl) {
    const urlTitle = extractTitleFromUrl(amazonUrl);
    if (urlTitle) {
      return truncateWithEllipsis(urlTitle, 50);
    }
  }
  
  // 3. Create category-based title from ASIN pattern
  const categoryTitle = createCategoryTitle(asin);
  if (categoryTitle) {
    return categoryTitle;
  }
  
  // 4. Final fallback
  return 'Quality Product';
}

/**
 * Clean existing title by removing unwanted elements
 */
function cleanTitle(title: string): string {
  return title
    .trim()
    // Remove Amazon-specific elements
    .replace(/\s*\|\s*Amazon\.com.*$/i, '')
    .replace(/\s*-\s*Amazon\.com.*$/i, '')
    .replace(/^Amazon\.com\s*:\s*/i, '')
    .replace(/Amazon\.com/gi, '')
    // Remove ASINs and product codes
    .replace(/\b[A-Z0-9]{10}\b/g, '')
    .replace(/\s*-\s*[A-Z0-9]{10}\s*/g, '')
    .replace(/\([A-Z0-9]{10}\)/g, '')
    // Remove common marketplace indicators
    .replace(/\s*\|\s*eBay.*$/i, '')
    .replace(/\s*-\s*eBay.*$/i, '')
    // Clean up punctuation and spacing
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*$/, '')
    .replace(/^\s*-\s*/, '')
    .replace(/\s*\|\s*$/, '')
    .replace(/^\s*\|\s*/, '')
    .trim();
}

/**
 * Truncate title with ellipsis, trying to break at word boundaries
 */
function truncateWithEllipsis(title: string, maxLength: number): string {
  if (title.length <= maxLength) {
    return title;
  }
  
  // Find the last space before the limit to avoid cutting words
  let truncateAt = maxLength - 3; // Reserve space for '...'
  const lastSpace = title.lastIndexOf(' ', truncateAt);
  
  if (lastSpace > maxLength * 0.7) { // Only use space if it's not too early
    truncateAt = lastSpace;
  }
  
  return title.substring(0, truncateAt).trim() + '...';
}

/**
 * Create category-based title from ASIN patterns
 */
function createCategoryTitle(asin: string): string | null {
  // This is very basic - could be enhanced with actual category detection
  const firstChar = asin.charAt(0);
  
  switch (firstChar) {
    case 'B':
      return 'Quality Product';
    case '0':
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
      return 'Popular Item';
    default:
      return null;
  }
}

/**
 * Common product categories for better fallbacks
 */
const CATEGORY_KEYWORDS = {
  electronics: ['electronic', 'device', 'gadget', 'tech'],
  home: ['kitchen', 'home', 'house', 'room'],
  tools: ['tool', 'kit', 'set', 'equipment'],
  clothing: ['shirt', 'pants', 'clothing', 'apparel'],
  sports: ['sport', 'fitness', 'exercise', 'outdoor'],
  books: ['book', 'manual', 'guide', 'reading']
};

/**
 * Detect product category from title
 */
export function detectCategory(title: string): string | null {
  const titleLower = title.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (titleLower.includes(keyword)) {
        return category;
      }
    }
  }
  
  return null;
} 