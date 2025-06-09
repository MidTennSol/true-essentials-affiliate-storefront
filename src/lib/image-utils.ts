/**
 * Simple Amazon image URL generation
 * Based on successful patterns from existing True Essentials site
 */

/**
 * Generate Amazon product image URL
 * Uses Amazon's image server with different size options
 */
export function getAmazonImageUrl(asin: string, size: 'small' | 'medium' | 'large' = 'large'): string {
  if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
    return getPlaceholderImage('Product');
  }

  // Amazon image URL patterns (commonly working)
  const sizeMap = {
    small: 'SL160',   // 160px
    medium: 'SL300',  // 300px  
    large: 'SL500'    // 500px
  };

  // Primary Amazon image URL pattern
  return `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.${sizeMap[size]}.jpg`;
}

/**
 * Get multiple Amazon image URL variants to try
 */
export function getAmazonImageVariants(asin: string): string[] {
  if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
    return [getPlaceholderImage('Product')];
  }

  return [
    // Primary patterns that often work
    `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg`,
    `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.L.jpg`, 
    `https://m.media-amazon.com/images/P/${asin}.01._SL500_.jpg`,
    `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SL300_.jpg`,
    
    // Fallback to placeholder
    getPlaceholderImage('Product')
  ];
}

/**
 * Generate attractive placeholder image
 */
export function getPlaceholderImage(title: string): string {
  // Use a product-focused placeholder service
  const category = getCategoryFromTitle(title);
  return `https://via.placeholder.com/400x400/e2e8f0/64748b?text=${encodeURIComponent(category)}`;
}

/**
 * Get category-appropriate placeholder
 */
function getCategoryFromTitle(title: string): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('electronic') || titleLower.includes('resistor') || titleLower.includes('transistor')) {
    return '🔌 Electronics';
  }
  if (titleLower.includes('kitchen') || titleLower.includes('gadget') || titleLower.includes('tool')) {
    return '🔧 Tools & Gadgets';
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