import { RoomActionError } from '@/lib/multiplayer-errors';
export { RoomActionError } from '@/lib/multiplayer-errors';
import { randomInt, randomUUID } from 'crypto';
import { evaluatePlayerGuess } from '@/lib/game-engine';
import { verifyMultiplayerMembershipToken } from '@/lib/server-crypto';
import { PLAYERS } from '@/data/players';
import { MultiplayerRoom, PublicMultiplayerRoom, RoomParticipant, RoomStatus, MULTIPLAYER_MAX_GUESSES } from '@/types/multiplayer';
import { getStoredRoom, saveStoredRoom, withRoomMutation } from '@/lib/multiplayer-room-store';

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
export function toPublicRoom(room: MultiplayerRoom): PublicMultiplayerRoom {
  return {
    id: room.id, roomCode: room.roomCode, hostId: room.hostId, hostName: room.hostName,
    status: room.status, participants: room.participants, createdAt: room.createdAt,
    roundId: room.roundId, revision: room.revision, startedAt: room.startedAt,
    finishedAt: room.finishedAt, winnerUserId: room.winnerUserId, winnerNickname: room.winnerNickname,
    reveal: room.reveal, countdownEndsAt: room.countdownEndsAt, finishReason: room.finishReason,
  };
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
    roundId: randomUUID(),
    revision: 1,
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
  nickname: string,
  membershipToken?: string
): Promise<{ room: MultiplayerRoom | null; error?: string }> {
  return withRoomMutation(roomCode, async (save) => {
    const room = await getStoredRoom(roomCode);

    if (!room) {
      return { room: null, error: 'Room not found. Please verify the 6-character room code.' };
    }

    if (room.status !== 'waiting' && !room.participants.some((p) => p.userId === userId)) {
      return { room: null, error: 'Match is already in progress.' };
    }

    if (membershipToken) assertRoomMembership(room, membershipToken, userId);
    const existingIdx = room.participants.findIndex((p) => p.userId === userId);
    if (existingIdx >= 0) {
      assertRoomMembership(room, membershipToken || '', userId);
      // Existing identities can only be reclaimed with their own valid credential.
      room.participants[existingIdx].nickname = nickname || room.participants[existingIdx].nickname;
      room.participants[existingIdx].connectedAt = Date.now();
      if (room.hostId === userId) room.hostName = room.participants[existingIdx].nickname;
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

    room.revision += 1;
    await save(room);
    return { room };
  });
}
export function assertRoomMembership(room: MultiplayerRoom, membershipToken: string, userId: string) {
  const membership = verifyMultiplayerMembershipToken(membershipToken, room.roomCode, userId);
  if (!membership || membership.roomId !== room.id) throw new RoomActionError('Valid room membership is required', 401);
  const participant = room.participants.find((item) => item.userId === userId);
  if (!participant || participant.role !== membership.role || (membership.role === 'host' && room.hostId !== userId)) {
    throw new RoomActionError('You are not authorized as this room participant', 403);
  }
  return participant;
}

async function requireRound(roomCode: string, userId: string, roundId: string, membershipToken: string) {
  if (!verifyMultiplayerMembershipToken(membershipToken, roomCode, userId)) {
    throw new RoomActionError('Valid room membership is required', 401);
  }
  const room = await getStoredRoom(roomCode);
  if (!room) throw new RoomActionError('Room not found', 404);
  assertRoomMembership(room, membershipToken, userId);
  if (room.roundId !== roundId) throw new RoomActionError('This round has ended. Sync the room and try again.');
  return room;
}

export async function submitRoomGuess(input: {
  roomCode: string; userId: string; roundId: string; membershipToken: string;
  guessedPlayerId: string; attemptNumber: number;
}) {
  const { roomCode, userId, roundId, membershipToken, guessedPlayerId, attemptNumber } = input;
  return withRoomMutation(roomCode, async (save) => {
    const room = await requireRound(roomCode, userId, roundId, membershipToken);
    if (room.status !== 'in_progress' || room.startedAt === undefined) throw new RoomActionError('The match is not active');
    const participant = room.participants.find((item) => item.userId === userId)!;
    if (participant.isSolved || participant.guessesCount >= MULTIPLAYER_MAX_GUESSES) {
      throw new RoomActionError('You have no guesses remaining');
    }
    if (!Number.isInteger(attemptNumber) || attemptNumber !== participant.guessesCount + 1) {
      throw new RoomActionError('Invalid attempt number. Sync the room before retrying.');
    }
    const previousGuesses = room.guessedPlayerIdsByUser?.[userId] || [];
    if (previousGuesses.includes(guessedPlayerId)) throw new RoomActionError('You already guessed this player');
    const evaluation = evaluatePlayerGuess(guessedPlayerId, room.targetPlayerId, attemptNumber);
    const target = PLAYERS.find((player) => player.id === room.targetPlayerId);
    if (!evaluation || !target) throw new RoomActionError('Invalid player ID', 400);
    evaluation.revealedAttributes = {
      country: evaluation.attributeMatches.country ? target.country : undefined,
      battingHand: evaluation.attributeMatches.battingHand ? target.battingHand : undefined,
      bowlingType: evaluation.attributeMatches.bowlingType ? target.bowlingType : undefined,
      role: evaluation.attributeMatches.role ? target.role : undefined,
      iplTeam: evaluation.attributeMatches.iplTeam ? target.iplTeam : undefined,
      retired: evaluation.attributeMatches.retired ? (target.retired ? 'YES' : 'NO') : undefined,
    };
    room.guessedPlayerIdsByUser = { ...room.guessedPlayerIdsByUser, [userId]: [...previousGuesses, guessedPlayerId] };
    participant.guessesCount = attemptNumber;
    participant.isSolved = evaluation.isCorrect;
    participant.recentGuessMatches = { attributeMatches: evaluation.attributeMatches, numericMatches: evaluation.numericMatches };
    room.revision += 1;
    const now = Date.now();
    if (evaluation.isCorrect) {
      participant.solveTimeMs = Math.max(0, now - room.startedAt);
      room.winnerUserId = userId;
      room.winnerNickname = participant.nickname;
      room.finishReason = 'solved';
    } else if (room.participants.every((player) => player.guessesCount >= MULTIPLAYER_MAX_GUESSES)) {
      room.finishReason = 'exhausted';
    }
    if (room.finishReason) {
      room.status = 'finished';
      room.finishedAt = now;
      room.countdownEndsAt = undefined;
      room.reveal = { id: target.id, name: target.name, country: target.country, role: target.role, photoUrl: target.photoUrl };
    }
    await save(room);
    return { room, evaluation, solveTimeMs: participant.solveTimeMs };
  });
}

export async function updateRoomStatusForUser(
  roomCode: string,
  userId: string,
  status: RoomStatus,
  roundId: string,
  membershipToken: string
): Promise<{ room: MultiplayerRoom | null; error?: string }> {
  return withRoomMutation(roomCode, async (save) => {
    const room = await requireRound(roomCode, userId, roundId, membershipToken);
    if (room.hostId !== userId) return { room: null, error: 'Only the host can change room status' };
    if (status !== 'countdown' && status !== 'in_progress') throw new RoomActionError('Invalid room status', 400);
    if (room.participants.length !== 2 || !room.participants.every((participant) => participant.isReady)) {
      throw new RoomActionError('Both players must be ready before the match starts');
    }
    // Retrying an already accepted transition must not restart the countdown or timer.
    if (room.status === status) return { room };
    if (status === 'countdown') {
      if (room.status !== 'waiting') throw new RoomActionError('The room is not waiting to start');
      room.countdownEndsAt = Date.now() + 3000;
    } else {
      if (room.status !== 'countdown' || room.countdownEndsAt === undefined) throw new RoomActionError('Countdown has not started');
      if (Date.now() < room.countdownEndsAt) throw new RoomActionError('Countdown is still running');
      room.startedAt = room.countdownEndsAt;
      room.countdownEndsAt = undefined;
    }
    room.status = status;
    room.revision += 1;
    await save(room);
    return { room };
  });
}

export async function rematchRoomForUser(
  roomCode: string,
  userId: string,
  roundId: string,
  membershipToken: string
): Promise<{ room: MultiplayerRoom | null; error?: string }> {
  return withRoomMutation(roomCode, async (save) => {
    const room = await requireRound(roomCode, userId, roundId, membershipToken);
    if (!room.participants.some((participant) => participant.userId === userId)) {
      return { room: null, error: 'You are not a member of this room' };
    }

    if (room.status !== 'finished') throw new RoomActionError('Only finished matches can be reset');
    room.finishReason = undefined;
    room.guessedPlayerIdsByUser = {};
    room.targetPlayerId = pickRandomMysteryPlayerId(room.targetPlayerId);
    room.roundId = randomUUID();
    room.revision += 1;
    room.status = 'waiting';
    room.reveal = undefined;
    room.countdownEndsAt = undefined;
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

    await save(room);
    return { room };
  });
}

export async function toggleReadyForUser(
  roomCode: string,
  userId: string,
  roundId: string,
  membershipToken: string
): Promise<{ room: MultiplayerRoom | null; error?: string }> {
  return withRoomMutation(roomCode, async (save) => {
    const room = await requireRound(roomCode, userId, roundId, membershipToken);
    if (room.status !== 'waiting') return { room: null, error: 'Readiness can only change while waiting' };

    const participant = room.participants.find((item) => item.userId === userId);
    if (!participant) return { room: null, error: 'You are not a member of this room' };

    participant.isReady = !participant.isReady;
    room.revision += 1;
    await save(room);
    return { room };
  });
}

