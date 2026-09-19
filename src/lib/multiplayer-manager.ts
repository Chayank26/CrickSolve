import { randomInt } from 'crypto';
import { PLAYERS } from '@/data/players';
import { MultiplayerRoom, RoomParticipant, RoomStatus } from '@/types/multiplayer';
import { getStoredRoom, saveStoredRoom } from '@/lib/multiplayer-room-store';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[randomInt(chars.length)];
  }
  return result;
}

export function pickRandomMysteryPlayerId(excludeId?: string): string {
  const pool = PLAYERS.filter((p) => p.id !== excludeId);
  const picked = pool[Math.floor(Math.random() * pool.length)] || PLAYERS[0];
  return picked.id;
}

export async function createRoom(hostId: string, hostName: string): Promise<MultiplayerRoom> {
  let code = generateRoomCode();
  while (await getStoredRoom(code)) {
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

  await saveStoredRoom(newRoom);
  return newRoom;
}

export async function getRoom(roomCode: string): Promise<MultiplayerRoom | null> {
  return getStoredRoom(roomCode);
}

export async function joinRoom(
  roomCode: string,
  userId: string,
  nickname: string
): Promise<{ room: MultiplayerRoom | null; error?: string }> {
  const room = await getStoredRoom(roomCode);

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
    // Multiplayer rooms are currently strict 1v1 matches.
    if (room.participants.length >= 2) {
      return { room: null, error: 'This 1v1 room is already full.' };
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

  await saveStoredRoom(room);
  return { room };
}

export async function updateRoomStatus(roomCode: string, status: RoomStatus): Promise<MultiplayerRoom | null> {
  const room = await getStoredRoom(roomCode);
  if (!room) return null;
  room.status = status;
  if (status === 'in_progress') {
    room.startedAt = Date.now();
  } else if (status === 'finished') {
    room.finishedAt = Date.now();
  }
  await saveStoredRoom(room);
  return room;
}

export async function updateRoomStatusForUser(
  roomCode: string,
  userId: string,
  status: RoomStatus
): Promise<{ room: MultiplayerRoom | null; error?: string }> {
  const room = await getStoredRoom(roomCode);
  if (!room) return { room: null, error: 'Room not found' };
  if (room.hostId !== userId) return { room: null, error: 'Only the host can change room status' };

  room.status = status;
  if (status === 'in_progress') room.startedAt = Date.now();
  if (status === 'finished') room.finishedAt = Date.now();
  await saveStoredRoom(room);
  return { room };
}

export async function rematchRoomForUser(
  roomCode: string,
  userId: string
): Promise<{ room: MultiplayerRoom | null; error?: string }> {
  const room = await getStoredRoom(roomCode);
  if (!room) return { room: null, error: 'Room not found' };
  if (!room.participants.some((participant) => participant.userId === userId)) {
    return { room: null, error: 'You are not a member of this room' };
  }

  room.targetPlayerId = pickRandomMysteryPlayerId(room.targetPlayerId);
  room.status = 'waiting';
  room.startedAt = undefined;
  room.finishedAt = undefined;
  room.winnerUserId = undefined;
  room.winnerNickname = undefined;

  room.participants.forEach((participant) => {
    participant.isReady = participant.role === 'host';
    participant.guessesCount = 0;
    participant.isSolved = false;
    participant.solveTimeMs = undefined;
    participant.recentGuessMatches = undefined;
  });

  await saveStoredRoom(room);
  return { room };
}

export async function rematchRoom(roomCode: string): Promise<MultiplayerRoom | null> {
  const room = await getStoredRoom(roomCode);
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

  await saveStoredRoom(room);
  return room;
}
