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
      // Validate URL length
      if (imageUrl.length < 500) {
        console.log('✅ Found landingImage via HTML parsing');
        return imageUrl;
      } else {
        console.warn('⚠️ landingImage URL too long, trying next method');
      }
    }
    
    // Method 2: Look for imgBlkFront in HTML
    const imgBlkFrontMatch = html.match(/id="imgBlkFront"[^>]*src="([^"]+)"/);
    if (imgBlkFrontMatch && imgBlkFrontMatch[1]) {
      const imageUrl = imgBlkFrontMatch[1].replace(/\._[^.]*_\./, '._AC_SL1000_.');
      // Validate URL length
      if (imageUrl.length < 500) {
        console.log('✅ Found imgBlkFront via HTML parsing');
        return imageUrl;
      } else {
        console.warn('⚠️ imgBlkFront URL too long, trying next method');
      }
    }
    
    // Method 3: Look for any Amazon image URLs in the HTML (single match only)
    const amazonImageRegex = /https:\/\/[^"]*\/images\/I\/[A-Z0-9]+[^"]*\.jpg/;
    const imageMatch = html.match(amazonImageRegex);
    
    if (imageMatch && imageMatch[0]) {
      const imageUrl = imageMatch[0];
      // Skip thumbnails and small images
      if (!imageUrl.includes('._SS') && 
          !imageUrl.includes('._SX') && 
          !imageUrl.includes('._SY') &&
          imageUrl.includes('images/I/')) {
        const cleanImageUrl = imageUrl.replace(/\._[^.]*_\./, '._AC_SL1000_.');
        console.log('✅ Found single image via regex pattern matching:', cleanImageUrl);
        return cleanImageUrl;
      }
    }
    
    // Method 4: Look for JSON data with images
    const jsonImageMatch = html.match(/"hiRes":"([^"]*images\/I\/[^"]+)"/);
    if (jsonImageMatch && jsonImageMatch[1]) {
      const imageUrl = jsonImageMatch[1];
      // Validate URL length
      if (imageUrl.length < 500) {
        console.log('✅ Found image in JSON data');
        return imageUrl;
      } else {
        console.warn('⚠️ JSON image URL too long, skipping');
      }
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
      // Clean up any HTML entities and validate URL length
      const cleanedUrl = scrapedImage.replace(/&quot;/g, '').replace(/&amp;/g, '&').trim();
      
      // Validate URL length (reasonable image URLs should be under 500 characters)
      if (cleanedUrl.length > 500) {
        console.warn('⚠️ Scraped image URL too long, using fallback:', cleanedUrl.length);
      } else {
        console.log('✅ Successfully extracted image via HTML parsing!');
        return cleanedUrl;
      }
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
    return 'Electronics';
  }
  if (titleLower.includes('kitchen') || titleLower.includes('gadget') || titleLower.includes('tool') || titleLower.includes('bundt') || titleLower.includes('nordic')) {
    return 'Kitchen+Tools';
  }
  if (titleLower.includes('climbing') || titleLower.includes('outdoor') || titleLower.includes('sport')) {
    return 'Sports+Outdoors';
  }
  if (titleLower.includes('security') || titleLower.includes('alarm') || titleLower.includes('sensor')) {
    return 'Security';
  }
  if (titleLower.includes('automotive') || titleLower.includes('car') || titleLower.includes('switch')) {
    return 'Automotive';
  }
  
  return 'Amazon+Product';
}

/**
 * Extract real Amazon product title and basic info from HTML
 */
export async function scrapeAmazonProductInfo(amazonUrl: string): Promise<{
  title: string | null;
  features: string[];
  description: string | null;
} | null> {
  try {
    console.log('🔍 Starting Amazon product info extraction for:', amazonUrl);
    
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
    console.log('✅ Successfully fetched Amazon page HTML for product info');
    
    // Extract title
    let title = null;
    
    // Method 1: Look for main product title by ID
    const titleMatch = html.match(/<span[^>]*id="productTitle"[^>]*>([^<]+)<\/span>/);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
      console.log('✅ Found product title:', title.substring(0, 50) + '...');
    }
    
    // Method 2: Alternative title selector
    if (!title) {
      const altTitleMatch = html.match(/<h1[^>]*class="[^"]*a-size-large[^"]*"[^>]*>([^<]+)<\/h1>/);
      if (altTitleMatch && altTitleMatch[1]) {
        title = altTitleMatch[1].trim();
        console.log('✅ Found title via alternative selector');
      }
    }
    
    // Extract feature bullets
    const features: string[] = [];
    
    // Look for feature bullets section - try multiple approaches
    const featureBulletsRegex = /<div[^>]*id="feature-bullets"[^>]*>(.*?)<\/div>/s;
    const featureBulletsMatch = html.match(featureBulletsRegex);
    
    if (featureBulletsMatch) {
      // Extract individual bullet points - try multiple selectors
      const bulletSelectors = [
        /<span[^>]*class="[^"]*a-list-item[^"]*"[^>]*>([^<]+)<\/span>/g,
        /<span[^>]*class="[^"]*a-offscreen[^"]*"[^>]*>([^<]+)<\/span>/g,
        /<li[^>]*>.*?<span[^>]*>([^<]+)<\/span>.*?<\/li>/g
      ];
      
      for (const regex of bulletSelectors) {
        let bulletMatch;
        while ((bulletMatch = regex.exec(featureBulletsMatch[1])) !== null) {
          const bullet = bulletMatch[1].trim();
          
          // Filter out common non-useful bullets
          if (bullet && 
              bullet.length > 10 && 
              bullet.length < 200 &&
              !bullet.toLowerCase().includes('make sure') &&
              !bullet.toLowerCase().includes('asin') &&
              !bullet.toLowerCase().includes('customer reviews') &&
              !bullet.toLowerCase().includes('best sellers rank') &&
              !bullet.toLowerCase().includes('imported') &&
              !features.includes(bullet)) {
            features.push(bullet);
          }
        }
      }
    }
    
    // If no features found, try alternative approach - look for product details
    if (features.length === 0) {
      console.log('🔍 No feature bullets found, trying product details...');
      
      // Try to find product details or description elements
      const detailsRegex = /<div[^>]*class="[^"]*product-facts[^"]*"[^>]*>(.*?)<\/div>/s;
      const detailsMatch = html.match(detailsRegex);
      
      if (detailsMatch) {
        const detailItems = detailsMatch[1].match(/<span[^>]*>([^<]+)<\/span>/g);
        if (detailItems) {
          detailItems.forEach(item => {
            const text = item.replace(/<[^>]*>/g, '').trim();
            if (text.length > 10 && text.length < 100) {
              features.push(text);
            }
          });
        }
      }
    }
    
    console.log(`✅ Extracted ${features.length} product features`);
    
    // Extract basic description (if available)
    let description = null;
    const descMatch = html.match(/<div[^>]*id="productDescription"[^>]*>([^<]+)<\/div>/);
    if (descMatch && descMatch[1]) {
      description = descMatch[1].trim();
    }
    
    return {
      title: title,
      features: features.slice(0, 5), // Limit to top 5 features
      description: description
    };
    
  } catch (error) {
    console.error('❌ Error during Amazon product info extraction:', error);
    return null;
  }
} 