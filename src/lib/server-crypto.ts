import { createHmac, timingSafeEqual } from 'crypto';
import { PlayerCategory } from '@/types/game';

const SECRET_KEY = process.env.CRICKSOLVE_SECRET_KEY || 'cricksolve-server-secret-salt-key-2026';

export interface SessionPayload {
  date: string;
  category: PlayerCategory;
  mode: string;
  startTimeMs: number;
}

export interface VictoryPayload {
  date: string;
  category: PlayerCategory;
  attempts: number;
  timeMs: number;
  userId: string;
}

function signPayload(payload: object): string {
  const jsonStr = JSON.stringify(payload);
  const b64Payload = Buffer.from(jsonStr).toString('base64url');
  const signature = createHmac('sha256', SECRET_KEY).update(b64Payload).digest('base64url');
  return `${b64Payload}.${signature}`;
}

function verifyPayload<T>(token: string): T | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [b64Payload, signature] = parts;
    const expectedSignature = createHmac('sha256', SECRET_KEY).update(b64Payload).digest('base64url');

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length) return null;
    if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;

    const jsonStr = Buffer.from(b64Payload, 'base64url').toString('utf8');
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

export function createSessionToken(
  date: string,
  category: PlayerCategory,
  mode: string = 'daily',
  startTimeMs: number = Date.now()
): string {
  const payload: SessionPayload = { date, category, mode, startTimeMs };
  return signPayload(payload);
}

export function verifySessionToken(token: string): SessionPayload | null {
  return verifyPayload<SessionPayload>(token);
}

export function createVictoryToken(
  date: string,
  category: PlayerCategory,
  attempts: number,
  timeMs: number,
  userId: string
): string {
  const payload: VictoryPayload = { date, category, attempts, timeMs, userId };
  return signPayload(payload);
}

export function verifyVictoryToken(token: string): VictoryPayload | null {
  return verifyPayload<VictoryPayload>(token);
}
