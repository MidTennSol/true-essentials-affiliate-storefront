# Airtable Setup Instructions

## Create Airtable Base

1. Go to [Airtable.com](https://airtable.com) and sign in to your account
2. Click "Create a base" → "Start from scratch"
3. Name your base: **"Affiliate Products"**

## Create Table Schema

Create a table called **"Affiliate Products"** with the following fields:

### Required Fields

| Field Name    | Field Type       | Settings/Options |
|---------------|------------------|------------------|
| **Title**     | Single line text | Primary field    |
| **Description** | Long text      | Rich text enabled |
| **Image URL** | Single line text | -                |
| **Affiliate URL** | Single line text | -                |
| **Slug**      | Formula         | `REGEX_REPLACE(LOWER(SUBSTITUTE({Title}, " ", "-")), "[^a-z0-9\\-]", "")` |
| **Created At** | Created time    | Include time     |

### Field Details

**Title**: The product name/title (e.g., "Wireless Bluetooth Headphones")

**Description**: Full product description for the detail page

**Image URL**: Direct URL to product image (will be populated automatically) - Use Single line text, not URL field type

**Affiliate URL**: The Amazon affiliate link (will be populated automatically) - Use Single line text, not URL field type

**Slug**: Auto-generated URL-friendly version of the title for routing

**Created At**: Timestamp when the record was created

## Get API Credentials

1. Go to [Airtable Developer Hub](https://airtable.com/developers)
2. Click "Create Token" 
3. Give it a name: "Affiliate Storefront"
4. Add these scopes:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`
5. Select your "Affiliate Products" base
6. Create the token and copy it

## Get Base ID

1. Go to your Airtable base
2. Click "Help" → "API documentation"
3. Your Base ID will be shown at the top (starts with "app...")

## Update Environment Variables

Copy `env.config.example` to `.env` and update:

```
AIRTABLE_API_KEY=your_actual_token_here
AIRTABLE_BASE_ID=your_base_id_here
AFFILIATE_TAG=your-amazon-affiliate-tag
```

## Important: Field Type Compatibility

**For Image URL and Affiliate URL fields, use "Single line text" instead of "URL" field type.** 

The URL field type in Airtable can sometimes cause issues with data retrieval and display. Single line text works more reliably for storing URLs and matches the setup of working affiliate storefronts.

## Test Connection

Once you've set up the base and environment variables, you can test the connection using the Airtable utilities we'll create. 