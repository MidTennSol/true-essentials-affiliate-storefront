import Airtable from 'airtable';
import { categorizeProduct } from './categorize.js';

// Types for our product data
export interface AirtableProduct {
  id?: string;
  fields: {
    Title: string;
    Description: string;
    'Image URL': string;
    'Affiliate URL': string;
    Slug: string;
    'Created At': string;
    Category?: string;
  };
}

export interface CreateProductData {
  title: string;
  description: string;
  imageUrl: string;
  affiliateUrl: string;
  category?: string;
  slug?: string;
}

// Initialize Airtable
const airtable = new Airtable({
  apiKey: import.meta.env.AIRTABLE_API_KEY,
}).base(import.meta.env.AIRTABLE_BASE_ID);

const table = airtable('Affiliate Products');

/**
 * Generate URL-friendly slug from title
 */
function generateSlugFromTitle(title: string): string {
  return title
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
 * Fetch all products from Airtable
 */
export async function getAllProducts(): Promise<AirtableProduct[]> {
  try {
    const records = await table.select({
      sort: [{ field: 'Created At', direction: 'desc' }],
    }).all();

    return records.map(record => ({
      id: record.id,
      fields: record.fields as AirtableProduct['fields'],
    }));
  } catch (error) {
    console.error('Error fetching products from Airtable:', error);
    throw new Error('Failed to fetch products');
  }
}

/**
 * Get a single product by slug
 */
export async function getProductBySlug(slug: string): Promise<AirtableProduct | null> {
  try {
    const records = await table.select({
      filterByFormula: `{Slug} = "${slug}"`,
      maxRecords: 1,
    }).all();

    if (records.length === 0) {
      return null;
    }

    return {
      id: records[0].id,
      fields: records[0].fields as AirtableProduct['fields'],
    };
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    throw new Error('Failed to fetch product');
  }
}

/**
 * Create a new product in Airtable with auto-categorization
 */
export async function createProduct(productData: CreateProductData): Promise<AirtableProduct> {
  try {
    // Validate required fields
    if (!productData.title || !productData.description || !productData.imageUrl || !productData.affiliateUrl) {
      throw new Error(`Missing required fields. Got: title=${!!productData.title}, description=${!!productData.description}, imageUrl=${!!productData.imageUrl}, affiliateUrl=${!!productData.affiliateUrl}`);
    }

    // Log the exact data being sent
    console.log('🔍 Attempting to create product with data:', {
      title: productData.title,
      description: productData.description?.substring(0, 100) + '...',
      affiliateUrl: productData.affiliateUrl,
      imageUrl: productData.imageUrl,
      category: productData.category
    });

    // Validate URL formats
    try {
      new URL(productData.imageUrl);
      console.log('✅ Image URL format is valid');
    } catch (urlError) {
      console.error('❌ Invalid Image URL:', productData.imageUrl);
      throw new Error(`Invalid Image URL format: "${productData.imageUrl}"`);
    }

    try {
      new URL(productData.affiliateUrl);
      console.log('✅ Affiliate URL format is valid');
    } catch (urlError) {
      console.error('❌ Invalid Affiliate URL:', productData.affiliateUrl);
      throw new Error(`Invalid Affiliate URL format: "${productData.affiliateUrl}"`);
    }

    // Auto-categorize the product if no category is provided
    const category = productData.category || categorizeProduct(productData.title, productData.description);
    
    // Prepare record data for Airtable (exclude Slug as it's computed by Airtable)
    const recordData = {
      'Title': productData.title,
      'Description': productData.description,
      'Image URL': productData.imageUrl,
      'Affiliate URL': productData.affiliateUrl,
      'Category': category,
    };

    console.log('📤 Final data being sent to Airtable:', recordData);
    console.log('🔗 Image URL being sent:', JSON.stringify(productData.imageUrl));
    console.log('🔗 Image URL length:', productData.imageUrl.length);
    console.log('🔗 Image URL type:', typeof productData.imageUrl);

    const record = await table.create(recordData);

    return {
      id: record.id,
      fields: record.fields as AirtableProduct['fields'],
    };
  } catch (error) {
    console.error('Error creating product in Airtable:', error);
    console.error('Product data that failed:', productData);
    
    // Preserve the original error message
    if (error instanceof Error) {
      throw new Error(`Failed to create product: ${error.message}`);
    } else {
      throw new Error(`Failed to create product: ${String(error)}`);
    }
  }
}

/**
 * Test Airtable connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await table.select({ maxRecords: 1 }).firstPage();
    return true;
  } catch (error) {
    console.error('Airtable connection test failed:', error);
    return false;
  }
}

/**
 * Get a single product by ID
 */
export async function getProductById(id: string): Promise<AirtableProduct | null> {
  try {
    const record = await table.find(id);
    
    return {
      id: record.id,
      fields: record.fields as AirtableProduct['fields'],
    };
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return null;
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(id: string, updates: Partial<CreateProductData>): Promise<AirtableProduct> {
  try {
    const updateFields: any = {};
    
    if (updates.title) updateFields['Title'] = updates.title;
    if (updates.description) updateFields['Description'] = updates.description;
    if (updates.imageUrl) updateFields['Image URL'] = updates.imageUrl;
    if (updates.affiliateUrl) updateFields['Affiliate URL'] = updates.affiliateUrl;
    if (updates.category) updateFields['Category'] = updates.category;
    
    const record = await table.update(id, updateFields);
    
    return {
      id: record.id,
      fields: record.fields as AirtableProduct['fields'],
    };
  } catch (error) {
    console.error('Error updating product:', error);
    throw new Error('Failed to update product');
  }
}

/**
 * Get total number of products
 */
export async function getProductCount(): Promise<number> {
  try {
    const records = await table.select({
      fields: ['Title'], // Only fetch the title field for efficiency
    }).all();
    
    return records.length;
  } catch (error) {
    console.error('Error getting product count:', error);
    return 0;
  }
} 