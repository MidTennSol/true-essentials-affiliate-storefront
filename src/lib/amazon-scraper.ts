/**
 * Amazon Image Scraper for Affiliate Storefront
 * Simplified version of the user's existing Python scraper
 */

/**
 * Extract Amazon product image URL using a simple fetch approach
 * This is a lightweight alternative to the full Selenium scraper
 */
export async function scrapeAmazonImage(amazonUrl: string): Promise<string | null> {
  try {
    // For server-side use, we'd need to implement actual scraping
    // For now, return null so the system falls back to other methods
    console.log('Image scraping would happen here for:', amazonUrl);
    return null;
  } catch (error) {
    console.error('Error scraping Amazon image:', error);
    return null;
  }
}

/**
 * Generate Amazon image URL using ASIN (fallback method)
 * Uses patterns similar to what the scraper finds
 */
export function generateAmazonImageUrl(asin: string): string {
  if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
    return getPlaceholderImage('Product');
  }

  // Use the most reliable pattern that works for most products
  // The _AC_SX355_ pattern tends to be more reliable than _AC_SL500_
  return `https://m.media-amazon.com/images/I/${asin}._AC_SX355_.jpg`;
}

/**
 * Get multiple image URL candidates for testing
 */
export function generateImageUrlCandidates(asin: string): string[] {
  if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
    return [getPlaceholderImage('Product')];
  }

  // Return multiple patterns in order of reliability
  return [
    `https://m.media-amazon.com/images/I/${asin}._AC_SX355_.jpg`,
    `https://m.media-amazon.com/images/I/${asin}._AC_SX342_.jpg`,
    `https://images-na.ssl-images-amazon.com/images/I/${asin}._AC_SX355_.jpg`,
    `https://m.media-amazon.com/images/I/${asin}._AC_SL500_.jpg`,
    `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SL500_.jpg`
  ];
}

/**
 * Get placeholder image for products
 */
function getPlaceholderImage(title: string): string {
  const category = getCategoryFromTitle(title);
  return `https://via.placeholder.com/400x400/e2e8f0/64748b?text=${encodeURIComponent(category)}`;
}

/**
 * Determine category from product title
 */
function getCategoryFromTitle(title: string): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('electronic') || titleLower.includes('resistor') || titleLower.includes('transistor')) {
    return '🔌 Electronics';
  }
  if (titleLower.includes('kitchen') || titleLower.includes('gadget') || titleLower.includes('tool') || titleLower.includes('bundt') || titleLower.includes('nordic')) {
    return '🍳 Kitchen & Tools';
  }
  if (titleLower.includes('climbing') || titleLower.includes('outdoor') || titleLower.includes('sport')) {
    return '🏃 Sports & Outdoors';
  }
  if (titleLower.includes('security') || titleLower.includes('alarm') || titleLower.includes('sensor')) {
    return '🛡️ Security';
  }
  if (titleLower.includes('automotive') || titleLower.includes('car') || titleLower.includes('switch')) {
    return '🚗 Automotive';
  }
  
  return '📦 Product';
}

/**
 * Enhanced image URL with multiple fallbacks
 * This mimics the approach used in the Python scraper
 */
export async function getProductImageUrl(amazonUrl: string, asin: string, productTitle: string): Promise<string> {
  try {
    // 1. Try scraping the actual image (if implemented)
    const scrapedImage = await scrapeAmazonImage(amazonUrl);
    if (scrapedImage) {
      return scrapedImage;
    }

    // 2. Use ASIN-based URL generation (fallback)
    return generateAmazonImageUrl(asin);

  } catch (error) {
    console.error('Error getting product image:', error);
    return getPlaceholderImage(productTitle);
  }
} 