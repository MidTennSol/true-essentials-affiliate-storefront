import Airtable from 'airtable';

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
  };
}

export interface CreateProductData {
  title: string;
  description: string;
  imageUrl: string;
  affiliateUrl: string;
}

// Initialize Airtable
const airtable = new Airtable({
  apiKey: import.meta.env.AIRTABLE_API_KEY,
}).base(import.meta.env.AIRTABLE_BASE_ID);

const table = airtable('Affiliate Products');

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
 * Create a new product in Airtable
 */
export async function createProduct(productData: CreateProductData): Promise<AirtableProduct> {
  try {
    const record = await table.create({
      'Title': productData.title,
      'Description': productData.description,
      'Image URL': productData.imageUrl,
      'Affiliate URL': productData.affiliateUrl,
    });

    return {
      id: record.id,
      fields: record.fields as AirtableProduct['fields'],
    };
  } catch (error) {
    console.error('Error creating product in Airtable:', error);
    throw new Error('Failed to create product');
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