import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

const chromePath = process.env.E2E_CHROME_PATH || (existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome') ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined);

export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  timeout: 120000,
  expect: { timeout: 15000 },
  use: {
    baseURL: 'http://127.0.0.1:3107',
    headless: true,
    actionTimeout: 15000,
    navigationTimeout: 30000,
    // Use an installed Chrome when provided; otherwise install Playwright Chromium.
    launchOptions: chromePath ? { executablePath: chromePath } : {},
  },
  webServer: {
    command: 'npx next start -p 3107 -H 127.0.0.1',
    url: 'http://127.0.0.1:3107',
    reuseExistingServer: false,
    env: {
      CRICKSOLVE_SECRET_KEY: 'local-integration-only-not-a-deployment-key',
      UPSTASH_REDIS_REST_URL: '', UPSTASH_REDIS_REST_TOKEN: '',
    },
  },
});
