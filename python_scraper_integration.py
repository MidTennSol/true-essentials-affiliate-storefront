#!/usr/bin/env python3
"""
Integration script for your existing Amazon scraper
Uploads scraped results to your True Essentials web app

Usage:
1. Run your existing scraper and export to CSV
2. Run this script: python python_scraper_integration.py scraped_products.csv
3. Products will be uploaded to your web app
"""

import csv
import json
import requests
import sys
from typing import List, Dict

# Configuration
WEB_APP_URL = "https://true-essentials-affiliate-storefront.vercel.app"  # Your deployed URL
API_KEY = "your-secret-key"  # Set this in your .env file as SCRAPER_API_KEY

def read_csv_products(csv_file: str) -> List[Dict]:
    """Read products from your existing CSV export"""
    products = []
    
    with open(csv_file, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        
        for row in reader:
            # Adapt these field names to match your CSV columns
            product = {
                'title': row.get('Title', row.get('title', '')),
                'asin': row.get('ASIN', row.get('asin', '')),
                'image_url': row.get('Image URL', row.get('image_url', row.get('ImageURL', ''))),
                'description': row.get('Description', row.get('description', '')),
                'affiliate_url': row.get('Affiliate URL', row.get('affiliate_url', ''))
            }
            
            # Only add products with required fields
            if product['title'] and product['asin'] and product['image_url']:
                products.append(product)
            else:
                print(f"⚠️  Skipping product with missing data: {product}")
    
    return products

def upload_to_webapp(products: List[Dict]) -> bool:
    """Upload products to your web app via API"""
    try:
        print(f"📤 Uploading {len(products)} products to web app...")
        
        response = requests.post(
            f"{WEB_APP_URL}/api/import-scraped.json",
            headers={
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            json={'products': products},
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Upload successful!")
            print(f"   📊 Total: {result['results']['total']}")
            print(f"   ✅ Successful: {result['results']['successful']}")
            print(f"   ❌ Failed: {result['results']['failed']}")
            return True
        else:
            print(f"❌ Upload failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error uploading: {e}")
        return False

def main():
    if len(sys.argv) != 2:
        print("Usage: python python_scraper_integration.py <csv_file>")
        print("Example: python python_scraper_integration.py scraped_products.csv")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    
    print(f"🔍 Reading products from {csv_file}...")
    products = read_csv_products(csv_file)
    
    if not products:
        print("❌ No valid products found in CSV file")
        sys.exit(1)
    
    print(f"📦 Found {len(products)} valid products")
    
    # Show preview
    if products:
        print(f"   First product: {products[0]['title']} (ASIN: {products[0]['asin']})")
    
    # Confirm upload
    response = input(f"\n🚀 Upload {len(products)} products to web app? (y/n): ")
    if response.lower() not in ['y', 'yes']:
        print("❌ Upload cancelled")
        sys.exit(0)
    
    # Upload
    success = upload_to_webapp(products)
    
    if success:
        print(f"\n🎉 Products successfully uploaded to {WEB_APP_URL}")
        print("   You can now view them in your storefront!")
    else:
        print("\n❌ Upload failed. Check your API key and internet connection.")

if __name__ == "__main__":
    main() 