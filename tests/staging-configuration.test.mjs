import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

function list(extra = {}) {
  const env = { ...process.env };
  for (const key of ['STAGING_BASE_URL', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']) delete env[key];
  return spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--config=playwright.staging.config.ts', '--list'], {
    env: { ...env, ...extra }, encoding: 'utf8', timeout: 15000,
  });
}
const placeholders = {
  STAGING_BASE_URL: 'https://staging.example.invalid',
  UPSTASH_REDIS_REST_URL: 'https://redis.example.invalid', UPSTASH_REDIS_REST_TOKEN: 'non-secret-placeholder',
  NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.example.invalid', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'non-secret-placeholder',
};

test('staging runner refuses missing configuration rather than running local tests', () => {
  const result = list();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Staging verification requires:/);
  assert.match(result.stderr, /No local fallback/);
});

test('staging suite discovers browser and live service checks without executing them', () => {
  const result = list(placeholders);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Total: 3 tests in 2 files/);
  assert.match(result.stdout, /staging Redis shares data/);
  assert.match(result.stdout, /staging Supabase delivers/);
});

test('staging runner rejects credential-bearing target URLs', () => {
  const result = list({ ...placeholders, STAGING_BASE_URL: 'https://user:password@staging.example.invalid' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /dedicated HTTPS staging origin/);
  assert.doesNotMatch(result.stderr, /user:password/);
});
