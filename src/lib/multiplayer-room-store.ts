import { Redis } from '@upstash/redis';
import { MultiplayerRoom } from '@/types/multiplayer';

const ROOM_TTL_SECONDS = 60 * 60 * 6;
const ROOM_KEY_PREFIX = 'cricksolve:multiplayer:room:';

const memoryRooms = new Map<string, { room: MultiplayerRoom; expiresAt: number }>();

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