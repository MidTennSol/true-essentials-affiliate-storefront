/**
 * Amazon Image Scraper for Affiliate Storefront
 * Uses Puppeteer to extract real Amazon product images
 * Based on proven scraping patterns from existing amazon-scraper
 */

import puppeteer from 'puppeteer';

/**
 * Configuration for Puppeteer
 */
const SCRAPING_CONFIG = {
  timeout: 30000, // 30 seconds
  headless: true, // Fixed to use boolean instead of 'new'
  user_agents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'
  ]
};

/**
 * Check if we're running in an environment that supports Puppeteer
 */
function isPuppeteerSupported(): boolean {
  // Check if we're in Vercel or similar serverless environments
  if (typeof process !== 'undefined') {
    const isVercel = process.env.VERCEL === '1';
    const isNetlify = process.env.NETLIFY === 'true';
    const isServerless = process.env.AWS_LAMBDA_FUNCTION_NAME;
    
    if (isVercel || isNetlify || isServerless) {
      console.log('🚫 Puppeteer not supported in serverless environment');
      return false;
    }
  }
  
  return true;
}

// Puppeteer doesn't need a separate setup function - it's handled in each scrape function

/**
 * Extract Amazon product image URL using Puppeteer
 * This replicates the exact method from the user's existing scraper
 */
export async function scrapeAmazonImage(amazonUrl: string): Promise<string | null> {
  let browser = null;
  
  try {
    console.log('🔍 Starting Puppeteer scraping for:', amazonUrl);
    
    // Check if Puppeteer is supported in this environment
    if (!isPuppeteerSupported()) {
      console.log('⚠️ Puppeteer not supported in this environment, skipping scraping');
      return null;
    }
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: SCRAPING_CONFIG.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set random user agent
    const userAgent = SCRAPING_CONFIG.user_agents[Math.floor(Math.random() * SCRAPING_CONFIG.user_agents.length)];
    await page.setUserAgent(userAgent);
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to Amazon product page
    await page.goto(amazonUrl, { 
      waitUntil: 'networkidle2',
      timeout: SCRAPING_CONFIG.timeout 
    });
    console.log('✅ Successfully navigated to Amazon page');
    
    // Wait for page to load
    await page.waitForSelector('#productTitle', { timeout: 10000 });
    
    // Method 1: Try to find main product image by ID "landingImage"
    try {
      const landingImageSrc = await page.$eval('#landingImage', (img: HTMLImageElement) => img.src);
      if (landingImageSrc) {
        console.log('✅ Found main image via landingImage');
        return landingImageSrc;
      }
    } catch (error) {
      console.log('⚠️ landingImage not found, trying alternative...');
    }
    
    // Method 2: Try alternative image element by ID "imgBlkFront"
    try {
      const imgBlkFrontSrc = await page.$eval('#imgBlkFront', (img: HTMLImageElement) => img.src);
      if (imgBlkFrontSrc) {
        console.log('✅ Found alternative image via imgBlkFront');
        return imgBlkFrontSrc;
      }
    } catch (error) {
      console.log('⚠️ imgBlkFront not found either');
    }
    
    // Method 3: Try to find any product image in the gallery
    try {
      const galleryImageSrc = await page.evaluate(() => {
        const selectors = ['#altImages img', '.a-dynamic-image', '.a-popover-trigger img'];
        
        for (const selector of selectors) {
          const images = document.querySelectorAll(selector);
          for (const img of images) {
            const imgElement = img as HTMLImageElement;
            if (imgElement.src && imgElement.src.includes('images/I/') && !imgElement.src.includes('._SS')) {
              return imgElement.src;
            }
          }
        }
        return null;
      });
      
      if (galleryImageSrc) {
        console.log('✅ Found gallery image');
        return galleryImageSrc;
      }
    } catch (error) {
      console.log('⚠️ No gallery images found');
    }
    
    console.log('❌ No image found via any method');
    return null;
    
  } catch (error) {
    console.error('❌ Error during Puppeteer scraping:', error);
    return null;
  } finally {
    // Always close the browser
    if (browser) {
      try {
        await browser.close();
        console.log('✅ Browser closed successfully');
      } catch (closeError) {
        console.error('⚠️ Error closing browser:', closeError);
      }
    }
  }
}

/**
 * Scrape complete Amazon product data using Puppeteer
 * Extracts title, image, and description just like the original scraper
 */
export async function scrapeAmazonProduct(amazonUrl: string): Promise<{
  title: string;
  image: string;
  description: string;
} | null> {
  let browser = null;
  
  try {
    console.log('🔍 Starting complete product scraping for:', amazonUrl);
    
    browser = await puppeteer.launch({
      headless: SCRAPING_CONFIG.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set random user agent
    const userAgent = SCRAPING_CONFIG.user_agents[Math.floor(Math.random() * SCRAPING_CONFIG.user_agents.length)];
    await page.setUserAgent(userAgent);
    
    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.goto(amazonUrl, { 
      waitUntil: 'networkidle2',
      timeout: SCRAPING_CONFIG.timeout 
    });
    
    // Extract title
    let title = 'Product';
    try {
      title = await page.$eval('#productTitle', (el: HTMLElement) => el.textContent?.trim() || 'Product');
      console.log(`✅ Found title: ${title.substring(0, 50)}...`);
    } catch (error) {
      console.log('⚠️ Could not extract title');
    }
    
    // Extract image using our existing method
    const image = await scrapeImageFromPage(page);
    
    // Extract description from bullet points
    let description = '';
    try {
      const bulletTexts = await page.evaluate(() => {
        const bulletPoints = document.querySelector('#feature-bullets');
        if (!bulletPoints) return [];
        
        const bullets = bulletPoints.querySelectorAll('.a-list-item span.a-list-item');
        const texts: string[] = [];
        
        bullets.forEach(bullet => {
          const text = bullet.textContent?.trim();
          if (text && !text.toLowerCase().includes('make sure') && text.length > 10) {
            texts.push(text);
          }
        });
        
        return texts.slice(0, 5);
      });
      
      description = bulletTexts.join(' ');
      console.log('✅ Found bullet points description');
    } catch (error) {
      console.log('⚠️ Could not extract bullet points');
    }
    
    return {
      title,
      image: image || getPlaceholderImage(title),
      description
    };
    
  } catch (error) {
    console.error('❌ Error during complete product scraping:', error);
    return null;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('⚠️ Error closing browser:', closeError);
      }
    }
  }
}

/**
 * Helper function to scrape image from existing page
 */
async function scrapeImageFromPage(page: any): Promise<string | null> {
  // Method 1: Try landingImage
  try {
    const landingImageSrc = await page.$eval('#landingImage', (img: HTMLImageElement) => img.src);
    if (landingImageSrc) {
      console.log('✅ Found main image via landingImage');
      return landingImageSrc;
    }
  } catch (error) {
    console.log('⚠️ landingImage not found, trying alternative...');
  }
  
  // Method 2: Try imgBlkFront
  try {
    const imgBlkFrontSrc = await page.$eval('#imgBlkFront', (img: HTMLImageElement) => img.src);
    if (imgBlkFrontSrc) {
      console.log('✅ Found alternative image via imgBlkFront');
      return imgBlkFrontSrc;
    }
  } catch (error) {
    console.log('⚠️ imgBlkFront not found either');
  }
  
  return null;
}

/**
 * Generate Amazon image URL using ASIN (fallback method)
 * Still providing fallback for when Selenium isn't available
 */
export function generateAmazonImageUrl(asin: string): string {
  if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
    return getPlaceholderImage('Product');
  }

  // Return placeholder since ASIN-based URLs are unreliable
  return getPlaceholderImage('Amazon Product');
}

/**
 * Get multiple image URL candidates for testing
 */
export function generateImageUrlCandidates(asin: string): string[] {
  if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
    return [getPlaceholderImage('Product')];
  }

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
 * Enhanced image URL with Puppeteer scraping as primary method
 */
export async function getProductImageUrl(amazonUrl: string, asin: string, productTitle: string): Promise<string> {
  try {
    // 1. Try simple HTML parsing first (works in serverless)
    console.log('🔍 Attempting HTML parsing image extraction...');
    const { getProductImageUrlSimple } = await import('./amazon-scraper-fetch');
    const simpleImage = await getProductImageUrlSimple(amazonUrl, asin, productTitle);
    
    // If we got a real image (not placeholder), return it
    if (simpleImage && !simpleImage.includes('placeholder.com')) {
      console.log('✅ Successfully extracted image via HTML parsing!');
      return simpleImage;
    }
    
    // 2. Try Puppeteer if available (local development)
    if (isPuppeteerSupported()) {
      console.log('🔍 Trying Puppeteer as backup...');
      const scrapedImage = await scrapeAmazonImage(amazonUrl);
      if (scrapedImage) {
        console.log('✅ Successfully extracted real Amazon image via Puppeteer!');
        return scrapedImage;
      }
    }

    // 3. Fallback to placeholder with category
    console.log('⚠️ All extraction methods failed, using placeholder');
    return getPlaceholderImage(productTitle);

  } catch (error) {
    console.error('❌ Error getting product image:', error);
    return getPlaceholderImage(productTitle);
  }
} 