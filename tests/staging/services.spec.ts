import { test, expect } from '@playwright/test';
import { Redis } from '@upstash/redis';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

// Run only via playwright.staging.config.ts against dedicated staging services.
test('staging Redis shares data and enforces atomic lock ownership', async () => {
  const options = { url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! };
  const writer = new Redis(options); const reader = new Redis(options);
  const prefix = `cricksolve:verification:${randomUUID()}`;
  const lock = `${prefix}:lock`; const data = `${prefix}:data`;
  const owner = randomUUID();
  try {
    expect(await writer.ping()).toBe('PONG');
    expect(await writer.set(lock, owner, { nx: true, ex: 30 })).toBe('OK');
    expect(await reader.set(lock, 'other-owner', { nx: true, ex: 30 })).toBeNull();
    const commit = "if redis.call('get', KEYS[1]) ~= ARGV[1] then return 0 end redis.call('set', KEYS[2], ARGV[2], 'EX', 30) return 1";
    expect(await reader.eval(commit, [lock, data], ['wrong-owner', 'rejected'])).toBe(0);
    expect(await reader.get(data)).toBeNull();
    expect(await writer.eval(commit, [lock, data], [owner, 'accepted'])).toBe(1);
    expect(await reader.get(data)).toBe('accepted');
    expect(await reader.ttl(data)).toBeGreaterThan(0);
    await writer.del(lock);
    expect(await writer.eval(commit, [lock, data], [owner, 'late-write'])).toBe(0);
    expect(await reader.get(data)).toBe('accepted');
  } catch {
    // Service errors can contain credential-bearing request details.
    throw new Error('Staging Redis verification failed. Check service configuration, connectivity and atomic-command support.');
  } finally {
    // Unique verification keys only; TTL is the fallback if cleanup is unavailable.
    await writer.del(lock, data).catch(() => undefined);
  }
});

function subscribe(channel: RealtimeChannel) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Staging realtime subscription timed out')), 15000);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') { clearTimeout(timer); resolve(); }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        clearTimeout(timer); reject(new Error('Staging realtime subscription failed'));
      }
    });
  });
}

test('staging Supabase delivers broadcast notifications between independent clients', async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  const sender = createClient(url, key, options); const receiver = createClient(url, key, options);
  const topic = `cricksolve_verification_${randomUUID()}`;
  const a = sender.channel(topic, { config: { broadcast: { self: false, ack: true } } });
  const b = receiver.channel(topic);
  const nonce = randomUUID();
  let received: unknown;
  b.on('broadcast', { event: 'VERIFY' }, ({ payload }) => { received = payload?.nonce; });
  try {
    await Promise.all([subscribe(a), subscribe(b)]);
    expect(await a.send({ type: 'broadcast', event: 'VERIFY', payload: { nonce } })).toBe('ok');
    await expect.poll(() => received, { timeout: 15000 }).toBe(nonce);
  } catch {
    throw new Error('Staging Supabase realtime verification failed. Check service configuration and public broadcast access.');
  } finally {
    await Promise.allSettled([sender.removeAllChannels(), receiver.removeAllChannels()]);
  }
});
