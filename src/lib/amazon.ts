/**
 * Amazon utility functions for ASIN extraction and affiliate URL conversion
 */

// Regular expressions for different Amazon URL formats
const ASIN_PATTERNS = [
  // Standard product URLs: /dp/ASIN or /gp/product/ASIN
  /\/dp\/([A-Z0-9]{10})/i,
  /\/gp\/product\/([A-Z0-9]{10})/i,
  
  // Product URLs with product name: /product-name/dp/ASIN
  /\/[^\/]+\/dp\/([A-Z0-9]{10})/i,
  
  // Amazon short URLs: /o/ASIN
  /\/o\/([A-Z0-9]{10})/i,
  
  // Query parameter format: ?asin=ASIN
  /[?&]asin=([A-Z0-9]{10})/i,
  
  // Legacy format: /exec/obidos/ASIN/ASIN
  /\/exec\/obidos\/ASIN\/([A-Z0-9]{10})/i,
];

/**
 * Extract ASIN from various Amazon URL formats
 */
export function extractASIN(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Clean the URL by removing common tracking parameters
  const cleanUrl = url.split('?')[0]; // Remove query parameters first for main patterns
  
  // Try each pattern
  for (const pattern of ASIN_PATTERNS) {
    const match = url.match(pattern); // Use full URL for query param patterns
    if (match && match[1]) {
      const asin = match[1].toUpperCase();
      // Validate ASIN format (10 characters, alphanumeric)
      if (/^[A-Z0-9]{10}$/.test(asin)) {
        return asin;
      }
    }
  }

  return null;
}

/**
 * Convert Amazon URL to affiliate URL
 */
export function createAffiliateURL(asin: string, affiliateTag?: string): string {
  if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
    throw new Error('Invalid ASIN format. ASIN must be 10 alphanumeric characters.');
  }

  const tag = affiliateTag || import.meta.env.AFFILIATE_TAG;
  
  if (!tag) {
    throw new Error('Affiliate tag not provided. Set AFFILIATE_TAG environment variable.');
  }

  return `https://www.amazon.com/dp/${asin}/?tag=${tag}`;
}

/**
 * Process Amazon URL: Extract ASIN and convert to affiliate URL
 */
export function processAmazonURL(url: string, affiliateTag?: string): {
  asin: string;
  affiliateUrl: string;
} | null {
  const asin = extractASIN(url);
  
  if (!asin) {
    return null;
  }

  try {
    const affiliateUrl = createAffiliateURL(asin, affiliateTag);
    return { asin, affiliateUrl };
  } catch (error) {
    console.error('Error creating affiliate URL:', error);
    return null;
  }
}

/**
 * Validate if URL is an Amazon URL
 */
export function isAmazonURL(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    return hostname.includes('amazon.com') || 
           hostname.includes('amazon.') || 
           hostname.includes('amzn.to') ||
           hostname.includes('a.co');
  } catch {
    return false;
  }
}

/**
 * Extract product information from Amazon URL (basic info that can be gleaned from URL)
 */
export function extractProductInfo(url: string): {
  asin: string | null;
  isAmazon: boolean;
  cleanUrl: string;
} {
  const isAmazon = isAmazonURL(url);
  const asin = isAmazon ? extractASIN(url) : null;
  
  // Create a clean URL without tracking parameters
  let cleanUrl = url;
  try {
    const urlObj = new URL(url);
    // Remove common tracking parameters
    const trackingParams = ['ref', 'ref_', 'tag', 'linkCode', 'camp', 'creative', 'creativeASIN', 'linkId'];
    trackingParams.forEach(param => urlObj.searchParams.delete(param));
    cleanUrl = urlObj.toString();
  } catch {
    // If URL parsing fails, use original URL
  }

  return {
    asin,
    isAmazon,
    cleanUrl
  };
}

/**
 * Bulk process multiple Amazon URLs
 */
export function processMultipleAmazonURLs(urls: string[], affiliateTag?: string): Array<{
  originalUrl: string;
  asin: string | null;
  affiliateUrl: string | null;
  success: boolean;
  error?: string;
}> {
  return urls.map(url => {
    const trimmedUrl = url.trim();
    
    if (!trimmedUrl) {
      return {
        originalUrl: url,
        asin: null,
        affiliateUrl: null,
        success: false,
        error: 'Empty URL'
      };
    }

    if (!isAmazonURL(trimmedUrl)) {
      return {
        originalUrl: url,
        asin: null,
        affiliateUrl: null,
        success: false,
        error: 'Not an Amazon URL'
      };
    }

    const result = processAmazonURL(trimmedUrl, affiliateTag);
    
    if (!result) {
      return {
        originalUrl: url,
        asin: null,
        affiliateUrl: null,
        success: false,
        error: 'Could not extract ASIN or create affiliate URL'
      };
    }

    return {
      originalUrl: url,
      asin: result.asin,
      affiliateUrl: result.affiliateUrl,
      success: true
    };
  });
} 