/**
 * Amazon Image Scraper for Affiliate Storefront
 * Since Amazon image URLs are not predictable from ASIN alone,
 * we'll use high-quality placeholder images until real scraping is implemented
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
 * WARNING: These URLs are often not real - Amazon doesn't host images at predictable URLs
 * This function now returns placeholder images instead
 */
export function generateAmazonImageUrl(asin: string): string {
  if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
    return getPlaceholderImage('Product');
  }

  // Instead of generating potentially broken Amazon URLs,
  // return a high-quality placeholder that actually works
  return getPlaceholderImage('Amazon Product');
}

/**
 * Get multiple image URL candidates for testing
 * Returns placeholder images since Amazon URLs are unreliable
 */
export function generateImageUrlCandidates(asin: string): string[] {
  if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
    return [getPlaceholderImage('Product')];
  }

  // Return working placeholder images instead of broken Amazon URLs
  return [
    getPlaceholderImage('Amazon Product'),
    `https://via.placeholder.com/400x400/f1f5f9/64748b?text=🛒+${asin}`,
    'https://via.placeholder.com/400x400/e2e8f0/64748b?text=📦+Product+Image'
  ];
}

/**
 * Get high-quality placeholder image for products
 */
function getPlaceholderImage(title: string): string {
  const category = getCategoryFromTitle(title);
  // Use a more professional placeholder service
  return `https://via.placeholder.com/400x400/f8fafc/475569?text=${encodeURIComponent(category)}`;
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
  
  return '📦 Amazon Product';
}

/**
 * Enhanced image URL with multiple fallbacks
 * Now focuses on reliable placeholder images instead of broken Amazon URLs
 */
export async function getProductImageUrl(amazonUrl: string, asin: string, productTitle: string): Promise<string> {
  try {
    // 1. Try scraping the actual image (if implemented)
    const scrapedImage = await scrapeAmazonImage(amazonUrl);
    if (scrapedImage) {
      return scrapedImage;
    }

    // 2. Return high-quality placeholder instead of broken Amazon URLs
    return getPlaceholderImage(productTitle);

  } catch (error) {
    console.error('Error getting product image:', error);
    return getPlaceholderImage(productTitle);
  }
} 