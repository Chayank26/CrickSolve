import { Redis } from '@upstash/redis';
import { randomUUID } from 'crypto';
import { MultiplayerRoom } from '@/types/multiplayer';

const ROOM_TTL_SECONDS = 60 * 60 * 6;
const ROOM_KEY_PREFIX = 'cricksolve:multiplayer:room:';

const memoryRooms = new Map<string, { room: MultiplayerRoom; expiresAt: number }>();
const memoryLocks = new Map<string, Promise<void>>();
const ROOM_LOCK_TTL_SECONDS = 5;

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

function normalizeRoomCode(roomCode: string): string {
  return roomCode.toUpperCase().trim();
}

function getRoomKey(roomCode: string): string {
  return `${ROOM_KEY_PREFIX}${normalizeRoomCode(roomCode)}`;
}

function pruneMemoryRooms(): void {
  const now = Date.now();
  for (const [roomCode, entry] of memoryRooms) {
    if (entry.expiresAt <= now) memoryRooms.delete(roomCode);
  }
}

export async function getStoredRoom(roomCode: string): Promise<MultiplayerRoom | null> {
  const normalizedCode = normalizeRoomCode(roomCode);

  if (redis) {
    return (await redis.get<MultiplayerRoom>(getRoomKey(normalizedCode))) || null;
  }

  pruneMemoryRooms();
  return memoryRooms.get(normalizedCode)?.room || null;
}

export async function saveStoredRoom(room: MultiplayerRoom): Promise<void> {
  const normalizedCode = normalizeRoomCode(room.roomCode);

  if (redis) {
    await redis.set(getRoomKey(normalizedCode), room, { ex: ROOM_TTL_SECONDS });
    return;
  }

  pruneMemoryRooms();
  memoryRooms.set(normalizedCode, {
    room,
    expiresAt: Date.now() + ROOM_TTL_SECONDS * 1000,
  });
}

export async function deleteStoredRoom(roomCode: string): Promise<void> {
  const normalizedCode = normalizeRoomCode(roomCode);

  if (redis) {
    await redis.del(getRoomKey(normalizedCode));
    return;
  }

  memoryRooms.delete(normalizedCode);
}

export function isSharedRoomStoreConfigured(): boolean {
  return redis !== null;
}

export async function withRoomMutation<T>(roomCode: string, mutation: () => Promise<T>): Promise<T> {
  const normalizedCode = normalizeRoomCode(roomCode);
  const lockKey = `${ROOM_KEY_PREFIX}${normalizedCode}:lock`;

  if (redis) {
    const lockToken = randomUUID();
    const acquired = await redis.set(lockKey, lockToken, {
      ex: ROOM_LOCK_TTL_SECONDS,
      nx: true,
    });
    if (acquired !== 'OK') throw new Error('ROOM_BUSY');

    try {
      return await mutation();
    } finally {
      await redis.eval(
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
        [lockKey],
        [lockToken]
      );
    }
  }

  const previous = memoryLocks.get(normalizedCode) || Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const queued = previous.then(() => current);
  memoryLocks.set(normalizedCode, queued);

  await previous;
  try {
    return await mutation();
  } finally {
    release();
    if (memoryLocks.get(normalizedCode) === queued) memoryLocks.delete(normalizedCode);
  }
}