/**
 * Content cleaning utilities to remove ASINs and product codes
 */

/**
 * Remove ASINs and product codes from text
 */
export function removeASINsFromText(text: string): string {
  if (!text) return text;
  
  return text
    // Remove ASIN patterns (10 character alphanumeric codes)
    .replace(/\b[A-Z0-9]{10}\b/g, '')
    // Remove common product code patterns
    .replace(/\b[A-Z]\d{2}[A-Z0-9]{7}\b/g, '')
    .replace(/\bB\d{2}[A-Z0-9]{7}\b/g, '')
    // Remove "Product" followed by codes
    .replace(/Product\s+[A-Z0-9]{10}/gi, 'Product')
    // Remove standalone ASINs with dashes or spaces
    .replace(/\s*-\s*[A-Z0-9]{10}\s*/g, ' ')
    .replace(/\s*\|\s*[A-Z0-9]{10}\s*/g, ' ')
    // Clean up extra spaces and punctuation
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*$/, '')
    .replace(/^\s*-\s*/, '')
    .trim();
}

/**
 * Clean product title by removing ASINs and codes
 */
export function cleanProductTitle(title: string): string {
  const cleaned = removeASINsFromText(title);
  
  // If title becomes too short after cleaning, provide a generic fallback
  if (cleaned.length < 5) {
    return 'Essential Product';
  }
  
  return cleaned;
}

/**
 * Clean product description by removing ASINs and codes
 */
export function cleanProductDescription(description: string): string {
  return removeASINsFromText(description);
}

/**
 * Clean all content fields
 */
export function cleanProductContent(content: {
  title: string;
  description: string;
  slug?: string;
}): {
  title: string;
  description: string;
  slug: string;
} {
  const cleanedTitle = cleanProductTitle(content.title);
  const cleanedDescription = cleanProductDescription(content.description);
  
  // Generate new slug from cleaned title
  const slug = generateSlugFromTitle(cleanedTitle);
  
  return {
    title: cleanedTitle,
    description: cleanedDescription,
    slug
  };
}

/**
 * Generate slug from cleaned title
 */
function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .substring(0, 50)
    .replace(/-+$/, '');
} 