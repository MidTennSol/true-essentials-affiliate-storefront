#!/usr/bin/env python3
"""
True Essentials - Product Import Script
Uses Amazon Creator API for real product data (images, titles, descriptions)
Then uploads to True Essentials web app via API endpoint

Features:
  - Caches Creator API results locally (no re-fetching on retry)
  - Uploads in batches of 50 to avoid timeouts
  - Falls back to CSV data if API fails for any product

Usage:
  python python_scraper_integration.py asins.csv

Requirements:
  pip install python-amazon-paapi requests
"""

import csv
import json
import os
import re
import requests
import sys
import time
from typing import List, Dict, Optional

WEB_APP_URL       = "https://www.true-essentials.com"
API_KEY           = "your-secret-key"
AFFILIATE_TAG     = "trueessent001-20"
CREDENTIAL_ID     = "4q7cupag9fe0qftn9c9a561730"
CREDENTIAL_SECRET = "126qgumjmkitluo1jsu9059vpqitgme99glut5omfhn4odoki4k5"
API_VERSION       = "2.1"
CACHE_FILE        = "creator_api_cache.json"
BATCH_SIZE        = 50

def load_cache():
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, 'r') as f:
            data = json.load(f)
            print(f"📦 Loaded cache with {len(data)} previously fetched ASINs")
            return data
    return {}

def save_cache(cache):
    with open(CACHE_FILE, 'w') as f:
        json.dump(cache, f, indent=2)

def get_api_client():
    try:
        from amazon_creatorsapi import AmazonCreatorsApi, Country
        return AmazonCreatorsApi(
            credential_id=CREDENTIAL_ID,
            credential_secret=CREDENTIAL_SECRET,
            version=API_VERSION,
            tag=AFFILIATE_TAG,
            country=Country.US,
            throttling=1,
        )
    except ImportError:
        print("❌ amazon_creatorsapi not installed. Run: python -m pip install python-amazon-paapi")
        sys.exit(1)

def enrich_with_creator_api(api, asin):
    try:
        items = api.get_items([asin])
        if not items:
            return None
        item = items[0]
        title = None
        if item.item_info and item.item_info.title:
            title = item.item_info.title.display_value
        image_url = None
        if item.images and item.images.primary:
            if item.images.primary.large:
                image_url = item.images.primary.large.url
            elif item.images.primary.medium:
                image_url = item.images.primary.medium.url
        features = []
        if item.item_info and item.item_info.features:
            features = item.item_info.features.display_values or []
        description = " ".join(features[:4]) if features else (f"Check out {title} on Amazon." if title else "")
        price = None
        if item.offers_v2 and item.offers_v2.listings:
            listing = item.offers_v2.listings[0]
            if listing.price and listing.price.money:
                price = f"${listing.price.money.amount:.2f}"
        return {
            "title": title, "image_url": image_url, "description": description,
            "affiliate_url": item.detail_page_url, "price": price,
            "features": features, "enriched": True,
        }
    except Exception as e:
        print(f"  ⚠️  Creator API error for {asin}: {e}")
        return None

def extract_asin_from_url(url):
    match = re.search(r'/dp/([A-Z0-9]{10})', url)
    return match.group(1) if match else ''

def read_csv_products(csv_file):
    products = []
    with open(csv_file, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        headers = reader.fieldnames or []
        header_map = {h.lower().replace(' ', '_'): h for h in headers}
        for row in reader:
            asin_key = header_map.get('asin') or header_map.get('asin_')
            asin = row.get(asin_key, '').strip() if asin_key else ''
            if not asin:
                affiliate_key = header_map.get('affiliate_url') or header_map.get('affiliateurl')
                if affiliate_key:
                    asin = extract_asin_from_url(row.get(affiliate_key, '').strip())
            if not asin:
                print(f"⚠️  Skipping row with no ASIN: {row.get('Title', 'unknown')}")
                continue
            title_key     = header_map.get('title')
            image_key     = header_map.get('image_url') or header_map.get('imageurl')
            desc_key      = header_map.get('description')
            affiliate_key = header_map.get('affiliate_url') or header_map.get('affiliateurl')
            products.append({
                'asin':          asin,
                'title':         row.get(title_key, '').strip()     if title_key     else '',
                'image_url':     row.get(image_key, '').strip()     if image_key     else '',
                'description':   row.get(desc_key, '').strip()      if desc_key      else '',
                'affiliate_url': row.get(affiliate_key, '').strip() if affiliate_key else '',
            })
    return products

def enrich_products(products):
    cache = load_cache()
    cached_count = sum(1 for p in products if p['asin'] in cache)
    fresh_count  = len(products) - cached_count
    if cached_count:
        print(f"⚡ {cached_count} ASINs already cached, {fresh_count} need fetching\n")
    api = get_api_client() if fresh_count > 0 else None
    if not fresh_count:
        print(f"✅ All ASINs cached — no API calls needed\n")
    else:
        print(f"📡 Connecting to Amazon Creator API...")
        print(f"✅ Creator API client ready\n")

    enriched = []
    total = len(products)
    for i, product in enumerate(products, 1):
        asin = product['asin']
        if asin in cache:
            api_data = cache[asin]
            print(f"[{i}/{total}] Cached:   {asin} ✅  {(api_data.get('title') or '')[:50]}" if api_data else f"[{i}/{total}] Cached:   {asin} ⚠️  no data")
        else:
            print(f"[{i}/{total}] Fetching: {asin}", end="", flush=True)
            api_data = enrich_with_creator_api(api, asin)
            cache[asin] = api_data
            save_cache(cache)
            if api_data:
                print(f" ✅  {(api_data.get('title') or '')[:50]}")
            else:
                print(f" ⚠️  Using fallback data")

        if api_data:
            product['title']         = api_data.get('title')         or product['title'] or f"Amazon Product {asin}"
            product['image_url']     = api_data.get('image_url')     or product['image_url']
            product['description']   = api_data.get('description')   or product['description']
            product['affiliate_url'] = api_data.get('affiliate_url') or product['affiliate_url'] or f"https://www.amazon.com/dp/{asin}?tag={AFFILIATE_TAG}"
            product['enriched']      = True
        else:
            if not product['title']:         product['title']         = f"Amazon Product {asin}"
            if not product['affiliate_url']: product['affiliate_url'] = f"https://www.amazon.com/dp/{asin}?tag={AFFILIATE_TAG}"
            product['enriched'] = False

        if product['image_url']:
            enriched.append(product)
        else:
            print(f"  ❌ Skipping {asin} — no image URL")
    return enriched

def upload_to_webapp(products):
    total         = len(products)
    total_batches = (total + BATCH_SIZE - 1) // BATCH_SIZE
    successful    = 0
    failed        = 0
    for i in range(0, total, BATCH_SIZE):
        batch     = products[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        print(f"📤 Uploading batch {batch_num}/{total_batches} ({len(batch)} products)...")
        try:
            response = requests.post(
                f"{WEB_APP_URL}/api/import-scraped.json",
                headers={'Content-Type': 'application/json', 'X-API-Key': API_KEY},
                json={'products': batch},
                timeout=120
            )
            if response.status_code == 200:
                result = response.json()
                successful += result['results']['successful']
                failed     += result['results']['failed']
                print(f"   ✅ Batch {batch_num} done — {result['results']['successful']} succeeded")
            else:
                print(f"   ❌ Batch {batch_num} failed: HTTP {response.status_code} — {response.text[:200]}")
                failed += len(batch)
        except Exception as e:
            print(f"   ❌ Batch {batch_num} error: {e}")
            failed += len(batch)
        if i + BATCH_SIZE < total:
            time.sleep(2)
    print(f"\n📊 Upload complete: {successful} succeeded, {failed} failed")
    return successful > 0

def main():
    if len(sys.argv) != 2:
        print("Usage: python python_scraper_integration.py <csv_file>")
        sys.exit(1)
    csv_file = sys.argv[1]
    print(f"📂 Reading products from {csv_file}...")
    products = read_csv_products(csv_file)
    if not products:
        print("❌ No valid products found in CSV")
        sys.exit(1)
    print(f"📦 Found {len(products)} products\n   First ASIN: {products[0]['asin']}")
    enriched   = enrich_products(products)
    api_count  = sum(1 for p in enriched if p.get('enriched'))
    fall_count = len(enriched) - api_count
    skip_count = len(products) - len(enriched)
    print(f"\n📊 Enrichment summary:")
    print(f"   ✅ Creator API data:   {api_count}")
    print(f"   ⚠️  Fallback data:     {fall_count}")
    print(f"   ❌ Skipped (no image): {skip_count}")
    if not enriched:
        print("\n❌ No products ready to upload")
        sys.exit(1)
    answer = input(f"\n🚀 Upload {len(enriched)} products to {WEB_APP_URL}? (y/n): ")
    if answer.lower() not in ['y', 'yes']:
        print("❌ Upload cancelled")
        sys.exit(0)
    success = upload_to_webapp(enriched)
    if success:
        print(f"\n🎉 Done! Products uploaded to {WEB_APP_URL}")
    else:
        print("\n❌ Upload failed.")

if __name__ == "__main__":
    main()