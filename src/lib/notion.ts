import Notion from '@notionhq/client';
const { Client } = Notion;
import { categorizeProduct } from './categorize.js';

// ─── Types (identical to airtable.ts — nothing else in your codebase changes) ─

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

// ─── Notion client ─────────────────────────────────────────────────────────────

function getClient(): Client {
  const apiKey = import.meta.env.NOTION_API_KEY;
  if (!apiKey) throw new Error('NOTION_API_KEY env var is missing');
  return new Client({ auth: apiKey });
}

function getDatabaseId(): string {
  const id = import.meta.env.NOTION_DATABASE_ID;
  if (!id) throw new Error('NOTION_DATABASE_ID env var is missing');
  return id;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

/**
 * Convert a raw Notion page result into our standard AirtableProduct shape.
 * This is the only place that knows about Notion's property structure.
 */
function pageToProduct(page: any): AirtableProduct {
  const props = page.properties;

  const getText = (prop: any): string => {
    if (!prop) return '';
    if (prop.type === 'title')       return prop.title?.[0]?.plain_text       ?? '';
    if (prop.type === 'rich_text')   return prop.rich_text?.[0]?.plain_text   ?? '';
    if (prop.type === 'url')         return prop.url                          ?? '';
    if (prop.type === 'select')      return prop.select?.name                 ?? '';
    if (prop.type === 'created_time')return prop.created_time                 ?? '';
    if (prop.type === 'date')        return prop.date?.start                  ?? '';
    return '';
  };

  return {
    id: page.id,
    fields: {
      Title:           getText(props['Title']),
      Description:     getText(props['Description']),
      'Image URL':     getText(props['Image URL']),
      'Affiliate URL': getText(props['Affiliate URL']),
      Slug:            getText(props['Slug']),
      'Created At':    getText(props['Created At']) || page.created_time || '',
      Category:        getText(props['Category']),
    },
  };
}

// ─── Public API (identical signatures to airtable.ts) ────────────────────────

/**
 * Fetch all products, newest first.
 */
export async function getAllProducts(): Promise<AirtableProduct[]> {
  try {
    const notion     = getClient();
    const databaseId = getDatabaseId();

    const allResults: any[] = [];
    let cursor: string | undefined = undefined;

    do {
      const response = await notion.databases.query({
        database_id: databaseId,
        start_cursor: cursor,
        page_size:    100,
        sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      });
      allResults.push(...response.results);
      cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
    } while (cursor);

    return allResults.map(pageToProduct).filter(p => p.fields.Title);
  } catch (error) {
    console.error('Error fetching products from Notion:', error);
    throw new Error('Failed to fetch products: ' + String(error));
  }
}

/**
 * Get a single product by slug.
 */
export async function getProductBySlug(slug: string): Promise<AirtableProduct | null> {
  try {
    const notion     = getClient();
    const databaseId = getDatabaseId();

    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Slug',
        rich_text: { equals: slug },
      },
      page_size: 1,
    });

    if (response.results.length === 0) return null;
    return pageToProduct(response.results[0]);
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    throw new Error('Failed to fetch product');
  }
}

/**
 * Create a new product page in Notion.
 */
export async function createProduct(productData: CreateProductData): Promise<AirtableProduct> {
  try {
    if (!productData.title || !productData.description || !productData.imageUrl || !productData.affiliateUrl) {
      throw new Error(
        `Missing required fields. Got: title=${!!productData.title}, description=${!!productData.description}, imageUrl=${!!productData.imageUrl}, affiliateUrl=${!!productData.affiliateUrl}`
      );
    }

    try { new URL(productData.imageUrl); } catch {
      throw new Error(`Invalid Image URL format: "${productData.imageUrl}"`);
    }
    try { new URL(productData.affiliateUrl); } catch {
      throw new Error(`Invalid Affiliate URL format: "${productData.affiliateUrl}"`);
    }

    const notion     = getClient();
    const databaseId = getDatabaseId();

    const category = productData.category || categorizeProduct(productData.title, productData.description);
    const slug     = productData.slug     || generateSlugFromTitle(productData.title);

    console.log('📤 Creating product in Notion:', productData.title);

    const page = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        'Title': {
          title: [{ text: { content: productData.title } }],
        },
        'Description': {
          rich_text: [{ text: { content: productData.description } }],
        },
        'Image URL': {
          url: productData.imageUrl,
        },
        'Affiliate URL': {
          url: productData.affiliateUrl,
        },
        'Slug': {
          rich_text: [{ text: { content: slug } }],
        },
        'Category': {
          select: { name: category },
        },
      },
    });

    console.log('✅ Product created in Notion:', productData.title);
    return pageToProduct(page);
  } catch (error) {
    console.error('Error creating product in Notion:', error);
    if (error instanceof Error) throw new Error(`Failed to create product: ${error.message}`);
    throw new Error(`Failed to create product: ${String(error)}`);
  }
}

/**
 * Update an existing product page in Notion.
 */
export async function updateProduct(id: string, updates: Partial<CreateProductData>): Promise<AirtableProduct> {
  try {
    const notion = getClient();

    const properties: any = {};

    if (updates.title)        properties['Title']         = { title:     [{ text: { content: updates.title } }] };
    if (updates.description)  properties['Description']   = { rich_text: [{ text: { content: updates.description } }] };
    if (updates.imageUrl)     properties['Image URL']     = { url: updates.imageUrl };
    if (updates.affiliateUrl) properties['Affiliate URL'] = { url: updates.affiliateUrl };
    if (updates.category)     properties['Category']      = { select: { name: updates.category } };

    const page = await notion.pages.update({ page_id: id, properties });
    return pageToProduct(page);
  } catch (error) {
    console.error('Error updating product in Notion:', error);
    throw new Error('Failed to update product');
  }
}

/**
 * Get a single product by its Notion page ID.
 */
export async function getProductById(id: string): Promise<AirtableProduct | null> {
  try {
    const notion = getClient();
    const page   = await notion.pages.retrieve({ page_id: id });
    return pageToProduct(page);
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return null;
  }
}

/**
 * Get total product count.
 */
export async function getProductCount(): Promise<number> {
  try {
    const notion     = getClient();
    const databaseId = getDatabaseId();

    // Notion doesn't have a count endpoint — fetch with minimal data
    const response = await notion.databases.query({
      database_id: databaseId,
      filter_properties: ['title'], // only fetch title property to keep it light
    });

    return response.results.length;
  } catch (error) {
    console.error('Error getting product count:', error);
    return 0;
  }
}

/**
 * Test that Notion is reachable and credentials work.
 */
export async function testConnection(): Promise<boolean> {
  try {
    const notion     = getClient();
    const databaseId = getDatabaseId();
    await notion.databases.retrieve({ database_id: databaseId });
    return true;
  } catch (error) {
    console.error('Notion connection test failed:', error);
    return false;
  }
}
