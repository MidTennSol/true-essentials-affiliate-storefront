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
 * Extract product title from Amazon page (simplified approach)
 * This would ideally scrape the actual title, but for now we'll use fallbacks
 */
export async function extractAmazonTitle(amazonUrl: string, asin: string): Promise<string> {
  // Try to get title from URL structure first
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
 * Generate simple, relevant product description
 */
export function generateSimpleDescription(title: string, asin: string): string {
  const cleanTitle = title.replace(/\.\.\.$/, '').trim();
  
  // Create more engaging simple descriptions
  const templates = [
    `Discover this ${cleanTitle.toLowerCase()} that customers are loving on Amazon. With great reviews and competitive pricing, it's become a popular choice for those seeking quality and value. See why it's trending and check current deals on Amazon!`,
    `Looking for a reliable ${cleanTitle.toLowerCase()}? This Amazon bestseller delivers on both quality and value. Join thousands of satisfied customers who've made this their go-to choice. View details and current pricing on Amazon now!`,
    `This ${cleanTitle.toLowerCase()} is getting attention on Amazon for all the right reasons. Customers love its quality, value, and performance. Don't miss out on what could be your next favorite purchase. Check it out on Amazon today!`
  ];
  
  // Use ASIN to consistently pick the same template for each product
  const templateIndex = asin ? parseInt(asin.slice(-1), 36) % templates.length : 0;
  return templates[templateIndex] || templates[0];
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
 * Generate enhanced description using AI (optional enhancement)
 */
export async function generateEnhancedDescription(title: string, asin?: string): Promise<string> {
  const openai = getOpenAIClient();
  
  if (!openai) {
    console.log('OpenAI API key not found, using simple description');
    return generateSimpleDescription(title, asin || '');
  }

  try {
    console.log(`Generating AI description for: ${title}`);
    
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
          - Keep under 120 words for optimal readability

          AVOID:
          - Technical jargon
          - Generic phrases like "high quality" 
          - Overly salesy language
          - Excessive punctuation or ALL CAPS`
        },
        {
          role: 'user',
          content: `Write a compelling product description for: "${title}"

          Focus on:
          - Why customers NEED this product
          - What problems it solves
          - The experience they'll have using it
          - Create urgency without being pushy
          - End with "Check it out on Amazon!" or similar natural CTA
          
          Keep it under 120 words and make every word count.`
        }
      ],
      max_tokens: 180,
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
    const description = await generateEnhancedDescription(title, asin);
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