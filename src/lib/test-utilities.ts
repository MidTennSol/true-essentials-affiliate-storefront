/**
 * Test utilities for Amazon URL processing and content generation
 * This file can be used to manually test all the utility functions
 */

import { extractASIN, createAffiliateURL, processAmazonURL, isAmazonURL, processMultipleAmazonURLs } from './amazon.js';
import { generateSlug, generateProductContent, validateContent } from './content.js';

/**
 * Test Amazon URL extraction with various formats
 */
export function testAmazonUrlExtraction() {
  console.log('🔍 Testing Amazon URL Extraction...\n');

  const testUrls = [
    'https://www.amazon.com/dp/B08N5WRWNW',
    'https://amazon.com/gp/product/B08N5WRWNW',
    'https://www.amazon.com/Echo-Dot-3rd-Gen/dp/B07FZ8S74R',
    'https://www.amazon.com/dp/B08N5WRWNW?ref=ppx_yo_dt_b_asin_title_o00_s00',
    'https://amzn.to/3xyz123', // This won't work without redirect resolution
    'https://www.amazon.com/o/B08N5WRWNW',
    'https://www.amazon.com/exec/obidos/ASIN/B08N5WRWNW',
    'https://www.amazon.com/something?asin=B08N5WRWNW',
    'https://not-amazon.com/dp/B08N5WRWNW', // Should fail
    'invalid-url' // Should fail
  ];

  testUrls.forEach((url, index) => {
    const asin = extractASIN(url);
    const isAmazon = isAmazonURL(url);
    console.log(`${index + 1}. URL: ${url}`);
    console.log(`   Is Amazon: ${isAmazon}`);
    console.log(`   ASIN: ${asin || 'Not found'}`);
    console.log('');
  });
}

/**
 * Test affiliate URL creation
 */
export function testAffiliateUrlCreation() {
  console.log('🔗 Testing Affiliate URL Creation...\n');

  const testASINs = ['B08N5WRWNW', 'B07FZ8S74R', 'invalid']; // Last one should fail
  const affiliateTag = 'test-tag-20';

  testASINs.forEach((asin, index) => {
    try {
      const affiliateUrl = createAffiliateURL(asin, affiliateTag);
      console.log(`${index + 1}. ASIN: ${asin}`);
      console.log(`   Affiliate URL: ${affiliateUrl}`);
    } catch (error) {
      console.log(`${index + 1}. ASIN: ${asin}`);
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    console.log('');
  });
}

/**
 * Test slug generation
 */
export function testSlugGeneration() {
  console.log('🔤 Testing Slug Generation...\n');

  const testTitles = [
    'Amazing Wireless Bluetooth Headphones',
    'Super Long Product Title That Should Be Truncated to Reasonable Length',
    'Product with Special @#$%^&*() Characters!',
    'Multiple    Spaces   Between   Words',
    '   Leading and Trailing Spaces   ',
    ''
  ];

  testTitles.forEach((title, index) => {
    const slug = generateSlug(title);
    console.log(`${index + 1}. Title: "${title}"`);
    console.log(`   Slug: "${slug}"`);
    console.log('');
  });
}

/**
 * Test complete URL processing workflow
 */
export function testCompleteWorkflow() {
  console.log('⚙️ Testing Complete Workflow...\n');

  const testUrls = [
    'https://www.amazon.com/dp/B08N5WRWNW',
    'https://amazon.com/Echo-Dot-3rd-Gen/dp/B07FZ8S74R?ref=something',
    'https://not-amazon.com/product/123'
  ];

  const affiliateTag = 'test-tag-20';

  testUrls.forEach((url, index) => {
    console.log(`${index + 1}. Testing URL: ${url}`);
    
    const result = processAmazonURL(url, affiliateTag);
    
    if (result) {
      console.log(`   ✅ Success!`);
      console.log(`   ASIN: ${result.asin}`);
      console.log(`   Affiliate URL: ${result.affiliateUrl}`);
    } else {
      console.log(`   ❌ Failed to process URL`);
    }
    console.log('');
  });
}

/**
 * Test bulk URL processing
 */
export function testBulkProcessing() {
  console.log('📦 Testing Bulk URL Processing...\n');

  const urls = [
    'https://www.amazon.com/dp/B08N5WRWNW',
    'https://amazon.com/gp/product/B07FZ8S74R',
    'https://not-amazon.com/product/123',
    '',
    'invalid-url',
    'https://www.amazon.com/Echo-Dot/dp/B07FZ8S74R'
  ];

  const results = processMultipleAmazonURLs(urls, 'test-tag-20');

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.success ? '✅' : '❌'} ${result.originalUrl}`);
    if (result.success) {
      console.log(`   ASIN: ${result.asin}`);
      console.log(`   Affiliate URL: ${result.affiliateUrl}`);
    } else {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  });

  const successCount = results.filter(r => r.success).length;
  console.log(`Summary: ${successCount}/${results.length} URLs processed successfully`);
}

/**
 * Test content validation
 */
export function testContentValidation() {
  console.log('✅ Testing Content Validation...\n');

  const testContents = [
    {
      title: 'Valid Product Title',
      description: 'This is a valid description with enough characters to pass validation',
      slug: 'valid-product-title'
    },
    {
      title: 'Too',
      description: 'Short',
      slug: 'ab'
    },
    {
      title: 'This title is way too long and should definitely fail the validation because it exceeds the maximum allowed length',
      description: 'Valid description',
      slug: 'invalid slug with spaces'
    }
  ];

  testContents.forEach((content, index) => {
    const validation = validateContent(content);
    console.log(`${index + 1}. ${validation.isValid ? '✅' : '❌'} Content Validation`);
    console.log(`   Title: "${content.title}"`);
    console.log(`   Description: "${content.description}"`);
    console.log(`   Slug: "${content.slug}"`);
    
    if (!validation.isValid) {
      console.log(`   Errors: ${validation.errors.join(', ')}`);
    }
    console.log('');
  });
}

/**
 * Run all tests
 */
export function runAllTests() {
  console.log('🚀 Running All Utility Tests\n');
  console.log('='.repeat(50));
  
  testAmazonUrlExtraction();
  console.log('='.repeat(50));
  
  testAffiliateUrlCreation();
  console.log('='.repeat(50));
  
  testSlugGeneration();
  console.log('='.repeat(50));
  
  testCompleteWorkflow();
  console.log('='.repeat(50));
  
  testBulkProcessing();
  console.log('='.repeat(50));
  
  testContentValidation();
  console.log('='.repeat(50));
  
  console.log('✨ All tests completed!');
}

/**
 * Test content generation (requires OpenAI API key)
 */
export async function testContentGeneration() {
  console.log('🤖 Testing Content Generation...\n');

  const testASIN = 'B08N5WRWNW';
  
  try {
    const content = await generateProductContent(testASIN);
    
    console.log('Generated Content:');
    console.log(`Title: ${content.title}`);
    console.log(`Description: ${content.description}`);
    console.log(`Slug: ${content.slug}`);
    
    const validation = validateContent(content);
    console.log(`\nValidation: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
    if (!validation.isValid) {
      console.log(`Errors: ${validation.errors.join(', ')}`);
    }
  } catch (error) {
    console.error('Error testing content generation:', error);
  }
} 