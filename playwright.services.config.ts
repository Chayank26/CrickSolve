import { defineConfig } from '@playwright/test';

// Verify newly created services before a staging website exists.
const required = [
  'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN',
  'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) throw new Error(`Service verification requires: ${missing.join(', ')}`);

export default defineConfig({
  testDir: './tests/staging',
  workers: 1,
  timeout: 45000,
});
