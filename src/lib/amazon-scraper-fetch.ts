/**
 * Lightweight Amazon Image Scraper for Serverless Environments
 * Uses fetch + HTML parsing instead of Puppeteer
 * Works on Vercel, Netlify, and other serverless platforms
 */

/**
 * Extract Amazon product image using simple fetch + HTML parsing
 */
export async function scrapeAmazonImageSimple(amazonUrl: string): Promise<string | null> {
  try {
    console.log('🔍 Starting simple HTML scraping for:', amazonUrl);
    
    // Fetch the Amazon page HTML
    const response = await fetch(amazonUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      console.log('❌ Failed to fetch Amazon page:', response.status);
      return null;
    }
    
    const html = await response.text();
    console.log('✅ Successfully fetched Amazon page HTML');
    
    // Method 1: Look for landingImage in HTML
    const landingImageMatch = html.match(/id="landingImage"[^>]*src="([^"]+)"/);
    if (landingImageMatch && landingImageMatch[1]) {
      const imageUrl = landingImageMatch[1].replace(/\._[^.]*_\./, '._AC_SL1000_.');
      console.log('✅ Found landingImage via HTML parsing');
      return imageUrl;
    }
    
    // Method 2: Look for imgBlkFront in HTML
    const imgBlkFrontMatch = html.match(/id="imgBlkFront"[^>]*src="([^"]+)"/);
    if (imgBlkFrontMatch && imgBlkFrontMatch[1]) {
      const imageUrl = imgBlkFrontMatch[1].replace(/\._[^.]*_\./, '._AC_SL1000_.');
      console.log('✅ Found imgBlkFront via HTML parsing');
      return imageUrl;
    }
    
    // Method 3: Look for any Amazon image URLs in the HTML
    const amazonImageRegex = /https:\/\/[^"]*\/images\/I\/[A-Z0-9]+\.[^"]*\.jpg/g;
    const imageMatches = html.match(amazonImageRegex);
    
    if (imageMatches && imageMatches.length > 0) {
      // Filter out thumbnails and get the largest image
      const goodImages = imageMatches.filter(url => 
        !url.includes('._SS') && 
        !url.includes('._SX') && 
        !url.includes('._SY') &&
        url.includes('images/I/')
      );
      
      if (goodImages.length > 0) {
        const imageUrl = goodImages[0].replace(/\._[^.]*_\./, '._AC_SL1000_.');
        console.log('✅ Found image via regex pattern matching');
        return imageUrl;
      }
    }
    
    // Method 4: Look for JSON data with images
    const jsonImageMatch = html.match(/"hiRes":"([^"]*images\/I\/[^"]+)"/);
    if (jsonImageMatch && jsonImageMatch[1]) {
      console.log('✅ Found image in JSON data');
      return jsonImageMatch[1];
    }
    
    console.log('❌ No images found via HTML parsing');
    return null;
    
  } catch (error) {
    console.error('❌ Error during HTML scraping:', error);
    return null;
  }
}

/**
 * Get product image with fallback chain
 */
export async function getProductImageUrlSimple(amazonUrl: string, asin: string, productTitle: string): Promise<string> {
  try {
    console.log('🔍 Attempting simple HTML image extraction...');
    
    const scrapedImage = await scrapeAmazonImageSimple(amazonUrl);
    if (scrapedImage) {
      console.log('✅ Successfully extracted image via HTML parsing!');
      return scrapedImage;
    }

    // Fallback to constructed URL patterns that sometimes work
    const constructedUrls = [
      `https://images-na.ssl-images-amazon.com/images/I/${asin}._AC_SL1000_.jpg`,
      `https://m.media-amazon.com/images/I/${asin}._AC_SL1000_.jpg`,
      `https://images-na.ssl-images-amazon.com/images/I/${asin}._AC_UL1000_.jpg`
    ];
    
    for (const testUrl of constructedUrls) {
      try {
        const response = await fetch(testUrl, { method: 'HEAD' });
        if (response.ok && response.headers.get('content-type')?.includes('image')) {
          console.log('✅ Found working constructed image URL:', testUrl);
          return testUrl;
        }
      } catch (e) {
        // Continue to next URL
      }
    }

    console.log('⚠️ All methods failed, using placeholder');
    return getPlaceholderImage(productTitle);

  } catch (error) {
    console.error('❌ Error getting product image:', error);
    return getPlaceholderImage(productTitle);
  }
}

/**
 * Generate placeholder image
 */
function getPlaceholderImage(title: string): string {
  const category = getCategoryFromTitle(title);
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
  
  return '�� Amazon Product';
} 