import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { PlayerCategory } from '@/types/game';

// Keep the development-only key stable across hot reloads in one server process.
const developmentState = globalThis as typeof globalThis & { cricksolveSigningKey?: string };
const SECRET_KEY =
  process.env.CRICKSOLVE_SECRET_KEY ||
  (process.env.NODE_ENV === 'production'
    ? ''
    : (developmentState.cricksolveSigningKey ??= randomBytes(32).toString('hex')));

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

export interface MultiplayerMembershipPayload {
  purpose: 'multiplayer-membership-v1';
  roomId: string;
  roomCode: string;
  userId: string;
  role: 'host' | 'guest';
  expiresAt: number;
}

function signPayload(payload: object): string {
  if (!SECRET_KEY) throw new Error('CRICKSOLVE_SECRET_KEY is required in production');
  const jsonStr = JSON.stringify(payload);
  const b64Payload = Buffer.from(jsonStr).toString('base64url');
  const signature = createHmac('sha256', SECRET_KEY).update(b64Payload).digest('base64url');
  return `${b64Payload}.${signature}`;
}

function verifyPayload<T>(token: string): T | null {
  try {
    if (!SECRET_KEY) return null;
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

export function createMultiplayerMembershipToken(
  room: { id: string; roomCode: string },
  userId: string,
  role: 'host' | 'guest',
  expiresAt: number = Date.now() + 6 * 60 * 60 * 1000
): string {
  return signPayload({
    purpose: 'multiplayer-membership-v1',
    roomId: room.id,
    roomCode: room.roomCode.toUpperCase().trim(),
    userId,
    role,
    expiresAt,
  } satisfies MultiplayerMembershipPayload);
}

export function verifyMultiplayerMembershipToken(
  token: string,
  roomCode: string,
  userId?: string
): MultiplayerMembershipPayload | null {
  const payload = verifyPayload<MultiplayerMembershipPayload>(token);
  if (!payload || typeof payload !== 'object' || payload.purpose !== 'multiplayer-membership-v1') return null;
  if (typeof payload.roomId !== 'string' || !payload.roomId || typeof payload.userId !== 'string' || !payload.userId) return null;
  if (payload.role !== 'host' && payload.role !== 'guest') return null;
  if (typeof roomCode !== 'string' || payload.roomCode !== roomCode.toUpperCase().trim()) return null;
  if (userId !== undefined && payload.userId !== userId) return null;
  if (typeof payload.expiresAt !== 'number' || !Number.isFinite(payload.expiresAt) || payload.expiresAt <= Date.now()) return null;
  return payload;
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
