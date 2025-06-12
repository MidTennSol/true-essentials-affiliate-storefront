import OpenAI from 'openai';

/**
 * Generate URL-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace spaces and special characters with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Replace multiple consecutive hyphens with single hyphen
    .replace(/-+/g, '-')
    // Limit length to 50 characters
    .substring(0, 50)
    .replace(/-+$/, ''); // Remove trailing hyphen if created by substring
}

/**
 * Extract product title from Amazon page using real scraping
 */
export async function extractAmazonTitle(amazonUrl: string, asin: string): Promise<string> {
  try {
    // Try to get real Amazon title first
    const { scrapeAmazonProductInfo } = await import('./amazon-scraper-fetch');
    const productInfo = await scrapeAmazonProductInfo(amazonUrl);
    
    if (productInfo?.title) {
      // Clean and format the real title
      const cleanedTitle = createCleanTitle(productInfo.title, 60);
      console.log('✅ Using real Amazon title:', cleanedTitle);
      return cleanedTitle;
    }
  } catch (error) {
    console.warn('Failed to scrape real Amazon title:', error);
  }
  
  // Fallback to smart title generation
  const { createSmartTitle } = await import('./title-extractor');
  return createSmartTitle(asin, amazonUrl);
}

/**
 * Create a clean, truncated title from extracted title
 */
export function createCleanTitle(rawTitle: string, maxLength: number = 50): string {
  if (!rawTitle || rawTitle.trim().length === 0) {
    return 'Product';
  }
  
  // Clean the title
  let cleanTitle = rawTitle
    .trim()
    // Remove common Amazon cruft
    .replace(/\s*\|\s*Amazon\.com.*$/i, '')
    .replace(/\s*-\s*Amazon\.com.*$/i, '')
    .replace(/^Amazon\.com\s*:\s*/i, '')
    // Remove ASINs and product codes
    .replace(/\b[A-Z0-9]{10}\b/g, '')
    .replace(/\s*-\s*[A-Z0-9]{10}\s*/g, '')
    // Clean up extra spaces and punctuation
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*$/, '')
    .replace(/^\s*-\s*/, '')
    .trim();
  
  // If title is too long, truncate with ellipsis
  if (cleanTitle.length > maxLength) {
    // Find the last space before the limit to avoid cutting words
    let truncateAt = maxLength;
    const lastSpace = cleanTitle.lastIndexOf(' ', maxLength - 3);
    if (lastSpace > maxLength * 0.7) { // Only use space if it's not too early
      truncateAt = lastSpace;
    }
    cleanTitle = cleanTitle.substring(0, truncateAt).trim() + '...';
  }
  
  return cleanTitle || 'Product';
}

/**
 * Generate intelligent, category-specific product description
 */
export function generateSimpleDescription(title: string, asin: string): string {
  const cleanTitle = title.replace(/\.\.\.$/, '').trim();
  const titleLower = cleanTitle.toLowerCase();
  
  // Detect product category and create specific descriptions
  if (titleLower.includes('bug zapper') || titleLower.includes('fly zapper') || titleLower.includes('insect killer')) {
    return `Keep your space pest-free with this effective bug zapper. Features powerful UV light attraction and electric grid to eliminate flies, mosquitoes, and other flying insects. Perfect for both indoor and outdoor use, providing chemical-free pest control for your home, patio, or garden. Easy to clean and maintain. Say goodbye to annoying bugs and enjoy a more comfortable environment!`;
  }
  
  if (titleLower.includes('drill') || titleLower.includes('dewalt') || titleLower.includes('cordless')) {
    return `This professional-grade cordless drill delivers the power and precision you need for any project. Features a high-performance motor, long-lasting battery, and ergonomic design for comfortable extended use. Perfect for drilling, driving screws, and tackle both light household tasks and demanding professional jobs. Trusted by contractors and DIY enthusiasts alike.`;
  }
  
  if (titleLower.includes('kitchen') || titleLower.includes('cooking') || titleLower.includes('chef') || titleLower.includes('cookware')) {
    return `Elevate your cooking experience with this premium kitchen essential. Designed for both amateur cooks and professional chefs, it combines functionality with durability. Features quality materials and thoughtful design elements that make meal preparation easier and more enjoyable. A must-have addition to any well-equipped kitchen.`;
  }
  
  if (titleLower.includes('led') || titleLower.includes('light') || titleLower.includes('lamp') || titleLower.includes('bulb')) {
    return `Upgrade your lighting with this energy-efficient LED solution. Provides bright, consistent illumination while reducing energy costs. Easy to install and built to last, offering reliable performance for years. Perfect for enhancing ambiance, improving visibility, or replacing outdated lighting fixtures.`;
  }
  
  if (titleLower.includes('security') || titleLower.includes('camera') || titleLower.includes('alarm') || titleLower.includes('sensor')) {
    return `Protect what matters most with this advanced security solution. Features cutting-edge technology for reliable monitoring and peace of mind. Easy to set up and integrate with existing systems. Whether for home or business use, this device provides the security features you need to stay protected.`;
  }
  
  if (titleLower.includes('outdoor') || titleLower.includes('camping') || titleLower.includes('hiking') || titleLower.includes('tactical')) {
    return `Built for adventure and designed to perform in challenging conditions. This rugged outdoor gear combines durability with functionality, making it perfect for camping, hiking, tactical applications, or everyday carry. Weather-resistant construction ensures reliable performance when you need it most.`;
  }
  
  if (titleLower.includes('electronic') || titleLower.includes('gadget') || titleLower.includes('device') || titleLower.includes('tech')) {
    return `Stay ahead with this innovative electronic device that combines cutting-edge technology with user-friendly design. Perfect for tech enthusiasts and everyday users alike, it delivers reliable performance and modern features. Enhance your digital lifestyle with this versatile and practical solution.`;
  }
  
  // Generic but more specific fallback
  const productType = extractProductType(cleanTitle);
  return `Experience the quality and reliability of this premium ${productType}. Carefully designed with attention to detail and built to meet high standards. Popular among customers for its excellent value and dependable performance. Perfect for those seeking a trustworthy solution that delivers on its promises. See why customers recommend this choice!`;
}

/**
 * Extract product type from title for better descriptions
 */
function extractProductType(title: string): string {
  const titleLower = title.toLowerCase();
  
  // Try to find the main product noun
  const productWords = [
    'zapper', 'drill', 'light', 'lamp', 'camera', 'sensor', 'tool', 'device', 
    'gadget', 'kit', 'set', 'system', 'equipment', 'machine', 'appliance',
    'charger', 'cable', 'adapter', 'holder', 'stand', 'mount', 'case', 'cover'
  ];
  
  for (const word of productWords) {
    if (titleLower.includes(word)) {
      return word;
    }
  }
  
  // Extract last meaningful word as product type
  const words = title.split(' ').filter(word => word.length > 2);
  return words.length > 0 ? words[words.length - 1].toLowerCase() : 'product';
}

/**
 * Detect product category for better AI context
 */
function detectProductCategory(title: string): string | null {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('bug zapper') || titleLower.includes('insect killer')) return 'Pest Control Device';
  if (titleLower.includes('drill') || titleLower.includes('tool')) return 'Power Tool';
  if (titleLower.includes('kitchen') || titleLower.includes('cooking')) return 'Kitchen Appliance';
  if (titleLower.includes('led') || titleLower.includes('light')) return 'Lighting Solution';
  if (titleLower.includes('security') || titleLower.includes('camera')) return 'Security Equipment';
  if (titleLower.includes('outdoor') || titleLower.includes('camping')) return 'Outdoor Gear';
  if (titleLower.includes('electronic') || titleLower.includes('gadget')) return 'Electronic Device';
  if (titleLower.includes('automotive') || titleLower.includes('car')) return 'Automotive Accessory';
  if (titleLower.includes('home') || titleLower.includes('household')) return 'Home & Garden';
  
  return null;
}

/**
 * Initialize OpenAI client (only if API key is available)
 */
function getOpenAIClient(): OpenAI | null {
  const apiKey = import.meta.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  
  return new OpenAI({
    apiKey: apiKey,
  });
}

/**
 * Generate enhanced description using AI with real Amazon data
 */
export async function generateEnhancedDescription(title: string, amazonUrl?: string, asin?: string): Promise<string> {
  const openai = getOpenAIClient();
  
  if (!openai) {
    console.log('OpenAI API key not found, using intelligent simple description');
    return generateSimpleDescription(title, asin || '');
  }

  try {
    console.log(`Generating AI description for: ${title}`);
    
    // Try to get real Amazon product features for better context
    let productContext = `Product title: ${title}`;
    let hasFeatures = false;
    
    if (amazonUrl) {
      try {
        const { scrapeAmazonProductInfo } = await import('./amazon-scraper-fetch');
        const productInfo = await scrapeAmazonProductInfo(amazonUrl);
        
        if (productInfo?.features && productInfo.features.length > 0) {
          productContext += `\n\nKey features from Amazon:\n${productInfo.features.map(f => `• ${f}`).join('\n')}`;
          hasFeatures = true;
          console.log('✅ Using real Amazon features for AI description');
        } else {
          console.log('⚠️ No Amazon features found, using title-based generation');
        }
      } catch (error) {
        console.warn('Could not fetch Amazon features for AI description:', error);
      }
    }
    
    // Add additional context based on product type detection
    const categoryContext = detectProductCategory(title);
    if (categoryContext) {
      productContext += `\n\nProduct category: ${categoryContext}`;
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an expert e-commerce copywriter specializing in Amazon affiliate marketing. Create compelling product descriptions that convert browsers into buyers.

          WRITING STYLE:
          - Conversational and engaging tone
          - Focus on customer benefits, not just features
          - Use emotional triggers and urgency
          - Include social proof elements
          - End with a clear call-to-action
          - Keep under 150 words for optimal readability

          AVOID:
          - Technical jargon
          - Generic phrases like "high quality" 
          - Overly salesy language
          - Excessive punctuation or ALL CAPS
          - Simply listing features without explaining benefits`
        },
        {
          role: 'user',
          content: `Write a compelling product description based on this Amazon product information:

          ${productContext}

          ${hasFeatures ? 
            'Use the features provided to explain customer benefits and real-world applications.' : 
            'Since no specific features are available, use your knowledge of this product type to create an informative and engaging description that explains typical benefits, uses, and why customers would want this product.'
          }

          Focus on:
          - What problems this product solves in everyday life
          - The experience and benefits customers will have
          - Why someone would choose this over alternatives
          - Make it feel authentic and helpful, not just marketing fluff
          - End with a natural call-to-action
          
          Keep it under 150 words and make every word count. Write in a natural, conversational tone that educates and persuades.`
        }
      ],
      max_tokens: 200,
      temperature: 0.75,
    });

    const description = response.choices[0]?.message?.content?.trim();
    
    // Validate the description meets our criteria
    if (description && description.length > 30 && description.length < 600 && !description.includes('I cannot') && !description.includes('I\'m unable')) {
      console.log(`✅ AI description generated: ${description.length} characters`);
      return description;
    } else {
      console.warn('AI description failed validation, using fallback');
      return generateSimpleDescription(title, asin || '');
    }
  } catch (error) {
    console.error('Error generating enhanced description:', error);
    // Return simple description as fallback
    return generateSimpleDescription(title, asin || '');
  }
}

/**
 * Generate product content using enhanced AI descriptions
 */
export async function generateProductContent(asin: string, amazonUrl?: string): Promise<{
  title: string;
  description: string;
  slug: string;
}> {
  console.log(`Generating enhanced content for ASIN: ${asin}`);
  
  try {
    // Extract title using smart extraction
    const title = await extractAmazonTitle(amazonUrl || '', asin);
    console.log(`Generated title: ${title}`);
    
    // Generate enhanced AI description (with fallback to simple)
    const description = await generateEnhancedDescription(title, amazonUrl, asin);
    console.log(`Generated enhanced description length: ${description.length} characters`);
    
    // Generate slug from title
    const slug = generateSlug(title);
    console.log(`Generated slug: ${slug}`);
    
    return {
      title,
      description,
      slug
    };
  } catch (error) {
    console.error('Error generating product content:', error);
    
    // Fallback content
    const fallbackTitle = `Essential Product`;
    return {
      title: fallbackTitle,
      description: `This is a quality product available on Amazon. Click the link below to view details and make your purchase.`,
      slug: generateSlug(fallbackTitle)
    };
  }
}

/**
 * Generate placeholder image URL (to be replaced with actual image scraping later)
 */
export function generatePlaceholderImageUrl(asin: string): string {
  // For now, return a placeholder image service URL
  // In production, you'd want to implement actual image scraping
  return `https://via.placeholder.com/400x400/cccccc/666666?text=${asin}`;
}

/**
 * Validate generated content
 */
export function validateContent(content: { title: string; description: string; slug: string }): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!content.title || content.title.length < 3) {
    errors.push('Title must be at least 3 characters long');
  }
  
  if (content.title && content.title.length > 100) {
    errors.push('Title must be less than 100 characters long');
  }
  
  if (!content.description || content.description.length < 10) {
    errors.push('Description must be at least 10 characters long');
  }
  
  if (!content.slug || content.slug.length < 3) {
    errors.push('Slug must be at least 3 characters long');
  }
  
  if (content.slug && !/^[a-z0-9-]+$/.test(content.slug)) {
    errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
} 