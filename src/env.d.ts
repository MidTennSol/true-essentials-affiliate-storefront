/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly AIRTABLE_API_KEY: string;
  readonly AIRTABLE_BASE_ID: string;
  readonly OPENAI_API_KEY?: string;
  readonly AFFILIATE_TAG: string;
  readonly ADMIN_PASSWORD: string;
  readonly NODE_ENV: 'development' | 'production';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 