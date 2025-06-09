// Quick test to check image URL patterns
const url = 'https://www.amazon.com/dp/B01BD7N1M4'; // Example Nordic Ware URL

// Test ASIN extraction
const asinPattern = /\/dp\/([A-Z0-9]{10})/;
const match = url.match(asinPattern);
const asin = match ? match[1] : null;

console.log('ASIN extracted:', asin);

if (asin) {
  // Test different image URL patterns
  const patterns = [
    `https://m.media-amazon.com/images/I/${asin}._AC_SL500_.jpg`,
    `https://images-na.ssl-images-amazon.com/images/I/${asin}._AC_SL500_.jpg`,
    `https://m.media-amazon.com/images/I/${asin}._AC_SX342_.jpg`,
    `https://m.media-amazon.com/images/I/${asin}._AC_SX355_.jpg`,
    `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SL500_.jpg`
  ];

  console.log('\nGenerated image URLs to test:');
  patterns.forEach((pattern, index) => {
    console.log(`${index + 1}. ${pattern}`);
  });
} 