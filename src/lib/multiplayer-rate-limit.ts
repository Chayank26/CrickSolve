import { createHash } from 'crypto';
import { Redis } from '@upstash/redis';
import { RoomActionError } from '@/lib/multiplayer-errors';

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN }) : null;
const localBuckets = new Map<string, { count: number; expiresAt: number }>();
const WINDOW_SECONDS = 60;

export async function enforceRateLimit(scope: string, subject: string, limit: number) {
  const hash = createHash('sha256').update(subject).digest('hex');
  const key = `cricksolve:multiplayer:limit:${scope}:${hash}`;
  let count: number;
  let retryAfter: number;
  if (redis) {
    try {
      const result = await redis.eval<[number], [number, number]>(
        "local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end; return {n, redis.call('TTL', KEYS[1])}",
        [key], [WINDOW_SECONDS]
      );
      [count, retryAfter] = result;
    } catch {
      throw new RoomActionError('Multiplayer is temporarily unavailable. Please retry.', 503);
    }
  } else {
    const now = Date.now();
    for (const [id, bucket] of localBuckets) if (bucket.expiresAt <= now) localBuckets.delete(id);
    const bucket = localBuckets.get(key) || { count: 0, expiresAt: now + WINDOW_SECONDS * 1000 };
    bucket.count += 1;
    localBuckets.set(key, bucket);
    count = bucket.count;
    retryAfter = Math.ceil((bucket.expiresAt - now) / 1000);
  }
  if (count > limit) throw new RoomActionError('Too many multiplayer requests. Please wait and retry.', 429, Math.max(1, retryAfter));
}

export async function limitMultiplayerRequest(request: Request, scope: string, limit: number) {
  // Only trust this header when deployment infrastructure overwrites client-supplied values.
  const subject = process.env.CRICKSOLVE_TRUST_PROXY === '1'
    ? request.headers.get('x-forwarded-for')?.split(',')[0].trim().slice(0, 128) || 'shared'
    : 'shared';
  await enforceRateLimit(scope, subject, limit);
}
