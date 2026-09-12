import { PLAYERS } from '@/data/players';
import { MultiplayerRoom, RoomParticipant, RoomStatus } from '@/types/multiplayer';

// In-memory rooms cache for rapid development & fallback resilience
const inMemoryRooms = new Map<string, MultiplayerRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function pickRandomMysteryPlayerId(excludeId?: string): string {
  const pool = PLAYERS.filter((p) => p.id !== excludeId);
  const picked = pool[Math.floor(Math.random() * pool.length)] || PLAYERS[0];
  return picked.id;
}

export function createRoom(hostId: string, hostName: string): MultiplayerRoom {
  let code = generateRoomCode();
  while (inMemoryRooms.has(code)) {
    code = generateRoomCode();
  }

  const targetPlayerId = pickRandomMysteryPlayerId();
  const hostParticipant: RoomParticipant = {
    userId: hostId,
    nickname: hostName || 'Host Cricketer',
    role: 'host',
    isReady: true,
    guessesCount: 0,
    isSolved: false,
    connectedAt: Date.now(),
  };

  const newRoom: MultiplayerRoom = {
    id: `room_${code}_${Date.now()}`,
    roomCode: code,
    hostId,
    hostName: hostName || 'Host Cricketer',
    status: 'waiting',
    targetPlayerId,
    participants: [hostParticipant],
    createdAt: Date.now(),
  };

  inMemoryRooms.set(code, newRoom);
  return newRoom;
}

export function getRoom(roomCode: string): MultiplayerRoom | null {
  const code = roomCode.toUpperCase().trim();
  return inMemoryRooms.get(code) || null;
}

export function joinRoom(roomCode: string, userId: string, nickname: string): { room: MultiplayerRoom | null; error?: string } {
  const code = roomCode.toUpperCase().trim();
  const room = inMemoryRooms.get(code);

  if (!room) {
    return { room: null, error: 'Room not found. Please verify the 6-character room code.' };
  }

  if (room.status === 'in_progress' && !room.participants.some((p) => p.userId === userId)) {
    return { room: null, error: 'Match is already in progress.' };
  }

  const existingIdx = room.participants.findIndex((p) => p.userId === userId);
  if (existingIdx >= 0) {
    // Update existing participant
    room.participants[existingIdx].nickname = nickname || room.participants[existingIdx].nickname;
    room.participants[existingIdx].connectedAt = Date.now();
  } else {
    // Add guest participant (up to 8 players)
    if (room.participants.length >= 8) {
      return { room: null, error: 'Room is currently full (maximum 8 players).' };
    }

    const guestParticipant: RoomParticipant = {
      userId,
      nickname: nickname || `Guest ${room.participants.length + 1}`,
      role: 'guest',
      isReady: false,
      guessesCount: 0,
      isSolved: false,
      connectedAt: Date.now(),
    };
    room.participants.push(guestParticipant);
  }

  return { room };
}

export function updateRoomStatus(roomCode: string, status: RoomStatus): MultiplayerRoom | null {
  const room = getRoom(roomCode);
  if (!room) return null;
  room.status = status;
  if (status === 'in_progress') {
    room.startedAt = Date.now();
  } else if (status === 'finished') {
    room.finishedAt = Date.now();
  }
  return room;
}

export function rematchRoom(roomCode: string): MultiplayerRoom | null {
  const room = getRoom(roomCode);
  if (!room) return null;

  const nextTarget = pickRandomMysteryPlayerId(room.targetPlayerId);
  room.targetPlayerId = nextTarget;
  room.status = 'waiting';
  room.startedAt = undefined;
  room.finishedAt = undefined;
  room.winnerUserId = undefined;
  room.winnerNickname = undefined;

  // Reset participant progress
  room.participants.forEach((p) => {
    p.isReady = p.role === 'host';
    p.guessesCount = 0;
    p.isSolved = false;
    p.solveTimeMs = undefined;
    p.recentGuessMatches = undefined;
  });

  return room;
}
