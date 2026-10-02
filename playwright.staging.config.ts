import { defineConfig } from '@playwright/test';
import localConfig from './playwright.config';

const required = [
  'STAGING_BASE_URL', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN',
  'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) throw new Error(`Staging verification requires: ${missing.join(', ')}. No local fallback is permitted.`);
const url = new URL(process.env.STAGING_BASE_URL!);
if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
  throw new Error('STAGING_BASE_URL must be a dedicated HTTPS staging origin, without credentials, a path or query parameters.');
}

export default defineConfig({
  ...localConfig,
  testDir: './tests',
  testMatch: ['e2e/**/*.spec.ts', 'staging/**/*.spec.ts'],
  // Staging must already be deployed with its own signing key and service config.
  // Never start the local memory-backed server or send its test key to staging.
  webServer: undefined,
  use: { ...localConfig.use, baseURL: url.origin },
});
