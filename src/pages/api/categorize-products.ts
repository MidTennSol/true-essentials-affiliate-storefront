import type { APIRoute } from 'astro';
import { getAllProducts, updateProduct } from '../../lib/airtable.ts';
import { categorizeProduct, AVAILABLE_CATEGORIES } from '../../lib/categorize.js';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Check if this is a manual categorization request
    const body = await request.json();
    if (body.action === 'categorize') {
      // Get all products
      const products = await getAllProducts();
      const results = [];
      
      for (const product of products) {
        if (!product.fields.Category || product.fields.Category === 'Miscellaneous') {
          // Categorize the product
          const category = categorizeProduct(
            product.fields.Title,
            product.fields.Description
          );
          
                     try {
             // Update the product in Airtable with the new category
             await updateProduct(product.id!, { 
               category: category
             });
             
             results.push({
               id: product.id,
               title: product.fields.Title,
               currentCategory: product.fields.Category || 'None',
               suggestedCategory: category,
               updated: true
             });
          } catch (error) {
            console.error(`Failed to update product ${product.id}:`, error);
            results.push({
              id: product.id,
              title: product.fields.Title,
              currentCategory: product.fields.Category || 'None',
              suggestedCategory: category,
              updated: false,
              error: 'Update failed'
            });
          }
        } else {
          results.push({
            id: product.id,
            title: product.fields.Title,
            currentCategory: product.fields.Category,
            suggestedCategory: product.fields.Category,
            updated: false,
            skipped: 'Already has category'
          });
        }
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: `Analyzed ${products.length} products`,
        results: results,
        availableCategories: AVAILABLE_CATEGORIES
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      message: 'Invalid action'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error in categorize-products API:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}; 