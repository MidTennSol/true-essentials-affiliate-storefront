import { google } from 'googleapis';
import { categorizeProduct } from './categorize.js';

// ─── Types (identical to airtable.ts so nothing else needs to change) ─────────

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

// ─── Column layout in the Sheet (Row 1 = headers, 0-indexed) ─────────────────
// A=0  B=1        C=2           D=3          E=4           F=5         G=6
// ID | Title | Description | Image URL | Affiliate URL | Slug | Category | Created At
// H=7
const COL = {
  ID:           0,
  TITLE:        1,
  DESCRIPTION:  2,
  IMAGE_URL:    3,
  AFFILIATE_URL:4,
  SLUG:         5,
  CATEGORY:     6,
  CREATED_AT:   7,
};
const SHEET_NAME = 'Products';
const HEADER_ROW  = 1; // rows are 1-indexed in Sheets API

// ─── Auth ─────────────────────────────────────────────────────────────────────

function getAuth() {
  const raw = import.meta.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON env var is missing');
  const credentials = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function getSheets() {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

function getSheetId() {
  const id = import.meta.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error('GOOGLE_SHEET_ID env var is missing');
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

/** Turn a raw Sheets row-array into our standard AirtableProduct shape */
function rowToProduct(row: any[], rowIndex: number): AirtableProduct {
  return {
    // Use the row's own ID cell if populated, otherwise synthesise one from
    // the row index so callers always get a stable string back.
    id: String(row[COL.ID] || `row-${rowIndex}`),
    fields: {
      Title:          String(row[COL.TITLE]         || ''),
      Description:    String(row[COL.DESCRIPTION]   || ''),
      'Image URL':    String(row[COL.IMAGE_URL]      || ''),
      'Affiliate URL':String(row[COL.AFFILIATE_URL]  || ''),
      Slug:           String(row[COL.SLUG]           || ''),
      'Created At':   String(row[COL.CREATED_AT]     || ''),
      Category:       String(row[COL.CATEGORY]       || ''),
    },
  };
}

/** Fetch every data row (skips header). Returns [rows, startRowIndex] */
async function fetchAllRows(): Promise<{ rows: any[][]; startRow: number }> {
  const sheets  = getSheets();
  const sheetId = getSheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!A2:H`, // skip header row
  });

  return {
    rows:     res.data.values || [],
    startRow: 2, // data starts at row 2
  };
}

// ─── Public API (identical signatures to airtable.ts) ────────────────────────

/**
 * Fetch all products, newest first (mirrors Airtable's Created At desc sort).
 */
export async function getAllProducts(): Promise<AirtableProduct[]> {
  try {
    const { rows, startRow } = await fetchAllRows();

    const products = rows
      .map((row, i) => rowToProduct(row, startRow + i))
      .filter(p => p.fields.Title); // skip blank rows

    // Sort newest-first by Created At string (ISO dates sort lexicographically)
    products.sort((a, b) =>
      b.fields['Created At'].localeCompare(a.fields['Created At'])
    );

    return products;
  } catch (error) {
    console.error('Error fetching products from Google Sheets:', error);
    throw new Error('Failed to fetch products');
  }
}

/**
 * Get a single product by slug.
 */
export async function getProductBySlug(slug: string): Promise<AirtableProduct | null> {
  try {
    const { rows, startRow } = await fetchAllRows();
    const idx = rows.findIndex(row => String(row[COL.SLUG] || '') === slug);
    if (idx === -1) return null;
    return rowToProduct(rows[idx], startRow + idx);
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    throw new Error('Failed to fetch product');
  }
}

/**
 * Create a new product row in the Sheet.
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

    const category  = productData.category || categorizeProduct(productData.title, productData.description);
    const slug      = productData.slug     || generateSlugFromTitle(productData.title);
    const createdAt = new Date().toISOString();
    // Use a short random ID similar to Airtable's record IDs
    const id        = `rec${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

    const sheets  = getSheets();
    const sheetId = getSheetId();

    // Order must match COL mapping above
    const newRow = [
      id,
      productData.title,
      productData.description,
      productData.imageUrl,
      productData.affiliateUrl,
      slug,
      category,
      createdAt,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range:         `${SHEET_NAME}!A:H`,
      valueInputOption: 'RAW',
      requestBody: { values: [newRow] },
    });

    console.log(`✅ Product created in Google Sheets: ${productData.title}`);

    return {
      id,
      fields: {
        Title:           productData.title,
        Description:     productData.description,
        'Image URL':     productData.imageUrl,
        'Affiliate URL': productData.affiliateUrl,
        Slug:            slug,
        'Created At':    createdAt,
        Category:        category,
      },
    };
  } catch (error) {
    console.error('Error creating product in Google Sheets:', error);
    if (error instanceof Error) throw new Error(`Failed to create product: ${error.message}`);
    throw new Error(`Failed to create product: ${String(error)}`);
  }
}

/**
 * Update an existing product row (matched by its ID cell).
 */
export async function updateProduct(id: string, updates: Partial<CreateProductData>): Promise<AirtableProduct> {
  try {
    const sheets  = getSheets();
    const sheetId = getSheetId();
    const { rows, startRow } = await fetchAllRows();

    const idx = rows.findIndex(row => String(row[COL.ID] || '') === id);
    if (idx === -1) throw new Error(`Product with id "${id}" not found`);

    const existingRow = rows[idx];
    const sheetRow    = startRow + idx; // 1-indexed sheet row number

    // Merge updates over existing values
    if (updates.title)       existingRow[COL.TITLE]         = updates.title;
    if (updates.description) existingRow[COL.DESCRIPTION]   = updates.description;
    if (updates.imageUrl)    existingRow[COL.IMAGE_URL]      = updates.imageUrl;
    if (updates.affiliateUrl)existingRow[COL.AFFILIATE_URL]  = updates.affiliateUrl;
    if (updates.category)    existingRow[COL.CATEGORY]       = updates.category;

    await sheets.spreadsheets.values.update({
      spreadsheetId:   sheetId,
      range:           `${SHEET_NAME}!A${sheetRow}:H${sheetRow}`,
      valueInputOption:'RAW',
      requestBody: { values: [existingRow] },
    });

    return rowToProduct(existingRow, sheetRow);
  } catch (error) {
    console.error('Error updating product in Google Sheets:', error);
    throw new Error('Failed to update product');
  }
}

/**
 * Get a single product by row ID.
 */
export async function getProductById(id: string): Promise<AirtableProduct | null> {
  try {
    const { rows, startRow } = await fetchAllRows();
    const idx = rows.findIndex(row => String(row[COL.ID] || '') === id);
    if (idx === -1) return null;
    return rowToProduct(rows[idx], startRow + idx);
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
    const { rows } = await fetchAllRows();
    return rows.filter(row => row[COL.TITLE]).length;
  } catch (error) {
    console.error('Error getting product count:', error);
    return 0;
  }
}

/**
 * Test that the Sheet is reachable and the credentials work.
 */
export async function testConnection(): Promise<boolean> {
  try {
    const sheets  = getSheets();
    const sheetId = getSheetId();
    await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range:         `${SHEET_NAME}!A1:A1`,
    });
    return true;
  } catch (error) {
    console.error('Google Sheets connection test failed:', error);
    return false;
  }
}
