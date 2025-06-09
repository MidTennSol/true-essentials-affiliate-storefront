/**
 * Amazon Product Image Utilities
 * Provides multiple strategies for fetching Amazon product images
 */

// Amazon Product Advertising API (PAAPI) - Official Method
export interface PaapiImageResponse {
  asin: string;
  title: string;
  imageUrl: string;
  price?: string;
}

/**
 * Fetch product image using Amazon Product Advertising API (PAAPI)
 * This is the official and recommended method
 */
export async function getImageFromPaapi(asin: string): Promise<string | null> {
  // TODO: Implement PAAPI integration when credentials are available
  // This requires:
  // 1. Amazon Associates account with qualifying sales
  // 2. PAAPI access keys (Access Key, Secret Key, Associate Tag)
  // 3. AWS SDK or PAAPI client library
  
  console.log('PAAPI integration pending - requires Amazon approval');
  return null;
}

/**
 * Generate Amazon image URL using known patterns
 * WARNING: This method is unreliable and may break
 * Use only as a temporary fallback
 */
export function generateAmazonImageUrl(asin: string, size: 'small' | 'medium' | 'large' = 'large'): string {
  const sizeMap = {
    small: 'SL160',
    medium: 'SL300', 
    large: 'SL500'
  };
  
  // Common Amazon image URL pattern (may not always work)
  return `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.${sizeMap[size]}.jpg`;
}

/**
 * Get placeholder image for products without images
 */
export function getPlaceholderImage(productTitle: string): string {
  // Using Unsplash for relevant placeholder images
  const keywords = encodeURIComponent(productTitle.split(' ').slice(0, 2).join(' '));
  return `https://source.unsplash.com/400x400/?${keywords},product`;
}

/**
 * Main function to get product image with fallback strategy
 */
export async function getProductImage(asin: string, productTitle: string): Promise<string> {
  try {
    // 1. Try official PAAPI first (when available)
    const paapiImage = await getImageFromPaapi(asin);
    if (paapiImage) {
      return paapiImage;
    }
    
    // 2. Try Amazon URL pattern (unreliable fallback)
    const amazonUrl = generateAmazonImageUrl(asin);
    
    // Test if the Amazon image URL works
    const imageExists = await checkImageExists(amazonUrl);
    if (imageExists) {
      return amazonUrl;
    }
    
    // 3. Use relevant placeholder as last resort
    return getPlaceholderImage(productTitle);
    
  } catch (error) {
    console.error('Error fetching product image:', error);
    return getPlaceholderImage(productTitle);
  }
}

/**
 * Check if an image URL is accessible
 */
async function checkImageExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch {
    return false;
  }
}

/**
 * Bulk process images for multiple products
 */
export async function bulkProcessImages(products: Array<{ asin: string; title: string }>): Promise<Array<{ asin: string; imageUrl: string }>> {
  const results = await Promise.all(
    products.map(async (product) => ({
      asin: product.asin,
      imageUrl: await getProductImage(product.asin, product.title)
    }))
  );
  
  return results;
} 