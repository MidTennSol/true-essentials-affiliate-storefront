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
 * Generate product title using OpenAI
 */
export async function generateProductTitle(asin: string): Promise<string> {
  const openai = getOpenAIClient();
  
  if (!openai) {
    // Fallback: generate basic title
    return `Product ${asin}`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates compelling product titles for affiliate marketing. Create short, catchy, SEO-friendly product titles that would encourage clicks and purchases.'
        },
        {
          role: 'user',
          content: `Create a compelling product title for an Amazon product with ASIN: ${asin}. The title should be concise (under 60 characters), appealing, and suitable for affiliate marketing. Just return the title, nothing else.`
        }
      ],
      max_tokens: 60,
      temperature: 0.7,
    });

    const title = response.choices[0]?.message?.content?.trim();
    return title || `Product ${asin}`;
  } catch (error) {
    console.error('Error generating product title:', error);
    return `Product ${asin}`;
  }
}

/**
 * Generate product description using OpenAI
 */
export async function generateProductDescription(asin: string, title?: string): Promise<string> {
  const openai = getOpenAIClient();
  
  if (!openai) {
    // Fallback: generate basic description  
    return `This is a great product available on Amazon. Click the link below to check it out and make your purchase.`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a skilled copywriter specializing in affiliate marketing. Write compelling product descriptions that highlight benefits, create urgency, and encourage purchases. Focus on value propositions and emotional triggers.'
        },
        {
          role: 'user',
          content: `Write a compelling product description for an Amazon product with ASIN: ${asin}${title ? ` and title: "${title}"` : ''}. The description should be 2-3 paragraphs, highlight key benefits, create some urgency, and include a call-to-action. Make it persuasive for affiliate marketing.`
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const description = response.choices[0]?.message?.content?.trim();
    return description || `This is a great product available on Amazon. Click the link below to check it out and make your purchase.`;
  } catch (error) {
    console.error('Error generating product description:', error);
    return `This is a great product available on Amazon. Click the link below to check it out and make your purchase.`;
  }
}

/**
 * Generate both title and description for a product
 */
export async function generateProductContent(asin: string): Promise<{
  title: string;
  description: string;
  slug: string;
}> {
  console.log(`Generating content for ASIN: ${asin}`);
  
  try {
    // Generate title first
    const title = await generateProductTitle(asin);
    console.log(`Generated title: ${title}`);
    
    // Generate description using the title for context
    const description = await generateProductDescription(asin, title);
    console.log(`Generated description length: ${description.length} characters`);
    
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
    const fallbackTitle = `Product ${asin}`;
    return {
      title: fallbackTitle,
      description: `This is a great product available on Amazon. Click the link below to check it out and make your purchase.`,
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
  
  if (!content.title || content.title.length < 5) {
    errors.push('Title must be at least 5 characters long');
  }
  
  if (content.title && content.title.length > 100) {
    errors.push('Title must be less than 100 characters long');
  }
  
  if (!content.description || content.description.length < 20) {
    errors.push('Description must be at least 20 characters long');
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