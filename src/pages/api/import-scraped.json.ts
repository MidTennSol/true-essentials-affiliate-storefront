/**
 * API endpoint to receive scraped product data from local Python scraper
 * POST /api/import-scraped.json
 */

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.products || !Array.isArray(data.products)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid data format. Expected { products: [...] }'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate API key (simple authentication)
    const apiKey = request.headers.get('X-API-Key');
    const expectedKey = import.meta.env.SCRAPER_API_KEY || 'your-secret-key';
    
    if (apiKey !== expectedKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid API key'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`📥 Received ${data.products.length} products from Python scraper`);

    // Import Airtable functions
    const { createProduct } = await import('../../lib/airtable');
    
    const results = [];
    let successful = 0;
    let failed = 0;

    // Process each product
    for (const product of data.products) {
      try {
        // Validate product data
        if (!product.title || !product.asin || !product.image_url) {
          throw new Error('Missing required fields: title, asin, image_url');
        }

        // Create product in Airtable
        const airtableResult = await createProduct({
          title: product.title,
          description: product.description || `Check out this ${product.title.toLowerCase()} on Amazon.`,
          affiliateUrl: product.affiliate_url || `https://www.amazon.com/dp/${product.asin}?tag=yourtag-20`,
          imageUrl: product.image_url
        });

        successful++;
        results.push({
          asin: product.asin,
          title: product.title,
          status: 'success',
          airtableId: airtableResult.id
        });

        console.log(`✅ Successfully imported: ${product.title}`);

      } catch (error) {
        failed++;
        results.push({
          asin: product.asin || 'unknown',
          title: product.title || 'unknown',
          status: 'error',
          error: String(error)
        });

        console.error(`❌ Failed to import product:`, error);
      }
    }

    console.log(`🎉 Import completed: ${successful} successful, ${failed} failed`);

    return new Response(JSON.stringify({
      success: true,
      message: `Imported ${successful} of ${data.products.length} products`,
      results: {
        total: data.products.length,
        successful,
        failed,
        details: results
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error: ' + String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 