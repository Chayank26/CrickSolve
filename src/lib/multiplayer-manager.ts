import { RoomActionError } from '@/lib/multiplayer-errors';
export { RoomActionError } from '@/lib/multiplayer-errors';
import { randomInt, randomUUID } from 'crypto';
import { evaluatePlayerGuess } from '@/lib/game-engine';
import { verifyMultiplayerMembershipToken } from '@/lib/server-crypto';
import { PLAYERS } from '@/data/players';
import { MULTIPLAYER_RECONNECT_MS, MultiplayerRoom, PublicMultiplayerRoom, RoomParticipant, RoomStatus, MULTIPLAYER_MAX_GUESSES, MULTIPLAYER_HINT_AFTER, MULTIPLAYER_HINT_LABELS, MultiplayerHintKey } from '@/types/multiplayer';
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
    status: room.status, participants: room.participants.map((participant) => ({
      ...participant, isConnected: participant.leftAt === undefined && Date.now() - (participant.lastSeenAt ?? participant.connectedAt) <= 15000,
      reconnectSeconds: Math.max(0, Math.ceil(((participant.lastSeenAt ?? participant.connectedAt) + MULTIPLAYER_RECONNECT_MS - Date.now()) / 1000)),
    })), createdAt: room.createdAt,
    roundId: room.roundId, revision: room.revision, startedAt: room.startedAt,
    finishedAt: room.finishedAt, winnerUserId: room.winnerUserId, winnerNickname: room.winnerNickname,
    rematchRequest: room.rematchRequest, reveal: room.reveal, countdownEndsAt: room.countdownEndsAt, finishReason: room.finishReason,
  };
}

function evaluateMultiplayerGuess(playerId: string, targetId: string, attempt: number) {
  const evaluation = evaluatePlayerGuess(playerId, targetId, attempt);
  const target = PLAYERS.find((player) => player.id === targetId);
  if (!evaluation || !target) return null;
    // Multiplayer has one selectable attribute bonus, not the solo trivia hint.
    delete evaluation.unlockedHint;
    evaluation.revealedAttributes = {
      country: evaluation.attributeMatches.country ? target.country : undefined,
      battingHand: evaluation.attributeMatches.battingHand ? target.battingHand : undefined,
      bowlingType: evaluation.attributeMatches.bowlingType ? target.bowlingType : undefined,
      role: evaluation.attributeMatches.role ? target.role : undefined,
      iplTeam: evaluation.attributeMatches.iplTeam ? target.iplTeam : undefined,
      retired: evaluation.attributeMatches.retired ? (target.retired ? 'YES' : 'NO') : undefined,
    };
  return evaluation;
}

export function toMemberRoomResponse(room: MultiplayerRoom, userId: string) {
  return {
    room: toPublicRoom(room), hint: room.hintsByUser?.[userId] || null,
    guesses: (room.guessedPlayerIdsByUser?.[userId] || []).map((id, index) =>
      evaluateMultiplayerGuess(id, room.targetPlayerId, index + 1)),
  };
}

export async function claimRoomHint(roomCode: string, userId: string, roundId: string, membershipToken: string, key: MultiplayerHintKey): Promise<{ room: MultiplayerRoom | null; error?: string }> {
  return withRoomMutation(roomCode, async (save) => {
    const room = await requireRound(roomCode, userId, roundId, membershipToken, save);
    if (!Object.hasOwn(MULTIPLAYER_HINT_LABELS, key)) throw new RoomActionError('Invalid hint attribute', 400);
    const participant = room.participants.find((player) => player.userId === userId)!;
    if (room.status !== 'in_progress' || participant.isSolved || participant.guessesCount >= MULTIPLAYER_MAX_GUESSES) {
      throw new RoomActionError('Hints are only available while you can still guess');
    }
    if (participant.guessesCount < MULTIPLAYER_HINT_AFTER) throw new RoomActionError('Your bonus hint unlocks after four guesses');
    const existing = room.hintsByUser?.[userId];
    if (existing) {
      if (existing.key !== key) throw new RoomActionError('You have already used your bonus hint');
      return { room }; // Retrying the same request never consumes a second hint.
    }
    if ((room.guessedPlayerIdsByUser?.[userId] || []).some((id) => evaluatePlayerGuess(id, room.targetPlayerId, 1)?.attributeMatches[key])) {
      throw new RoomActionError('This attribute is already unlocked. Choose a locked card.');
    }
    const target = PLAYERS.find((player) => player.id === room.targetPlayerId)!;
    const value = key === 'retired' ? (target.retired ? 'YES' : 'NO') : target[key];
    room.hintsByUser = { ...room.hintsByUser, [userId]: { key, value } };
    room.revision += 1;
    await save(room);
    return { room };
  });
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

    if (membershipToken) assertRoomMembership(room, membershipToken, userId, true);
    await reconcilePresence(room, save);
    if (room.closedAt !== undefined) throw new RoomActionError('This room has closed', 410);
    if (room.status !== 'waiting' && !room.participants.some((p) => p.userId === userId)) {
      return { room: null, error: 'Match is already in progress.' };
    }

    if (membershipToken) assertRoomMembership(room, membershipToken, userId, true);
    const existingIdx = room.participants.findIndex((p) => p.userId === userId);
    if (existingIdx >= 0) {
      assertRoomMembership(room, membershipToken || '', userId, true);
      // Existing identities can only be reclaimed with their own valid credential.
      room.participants[existingIdx].nickname = nickname || room.participants[existingIdx].nickname;
      room.participants[existingIdx].lastSeenAt = Date.now();
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
export function assertRoomMembership(room: MultiplayerRoom, membershipToken: string, userId: string, allowPromotion = false) {
  const membership = verifyMultiplayerMembershipToken(membershipToken, room.roomCode, userId);
  if (!membership || membership.roomId !== room.id) throw new RoomActionError('Valid room membership is required', 401);
  if (room.closedAt !== undefined) throw new RoomActionError('This room has closed', 410);
  const participant = room.participants.find((item) => item.userId === userId);
  const promoted = allowPromotion && membership.role === 'guest' && participant?.role === 'host' && room.hostId === userId && room.promotedHostIds?.includes(userId);
  if (!participant || participant.leftAt !== undefined || (participant.role !== membership.role && !promoted) || (membership.role === 'host' && room.hostId !== userId)) {
    throw new RoomActionError('You are not authorized as this room participant', 403);
  }
  return participant;
}

async function requireRound(roomCode: string, userId: string, roundId: string, membershipToken: string, save: (room: MultiplayerRoom) => Promise<void>, allowPromotion = false) {
  if (!verifyMultiplayerMembershipToken(membershipToken, roomCode, userId)) {
    throw new RoomActionError('Valid room membership is required', 401);
  }
  const room = await getStoredRoom(roomCode);
  if (!room) throw new RoomActionError('Room not found', 404);
  assertRoomMembership(room, membershipToken, userId, allowPromotion);
  if (room.roundId !== roundId) throw new RoomActionError('This round has ended. Sync the room and try again.');
  await reconcilePresence(room, save);
  const participant = assertRoomMembership(room, membershipToken, userId, allowPromotion);
  await touchParticipant(room, participant, save);
  return room;
}

export async function submitRoomGuess(input: {
  roomCode: string; userId: string; roundId: string; membershipToken: string;
  guessedPlayerId: string; attemptNumber: number;
}) {
  const { roomCode, userId, roundId, membershipToken, guessedPlayerId, attemptNumber } = input;
  return withRoomMutation(roomCode, async (save) => {
    const room = await requireRound(roomCode, userId, roundId, membershipToken, save);
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
    const evaluation = evaluateMultiplayerGuess(guessedPlayerId, room.targetPlayerId, attemptNumber);
    const target = PLAYERS.find((player) => player.id === room.targetPlayerId);
    if (!evaluation || !target) throw new RoomActionError('Invalid player ID', 400);
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
    const room = await requireRound(roomCode, userId, roundId, membershipToken, save);
    if (room.hostId !== userId) return { room: null, error: 'Only the host can change room status' };
    if (status !== 'countdown' && status !== 'in_progress') throw new RoomActionError('Invalid room status', 400);
    if (room.participants.length !== 2 || !room.participants.every((participant) => participant.isReady)) {
      throw new RoomActionError('Both players must be ready before the match starts');
    }
    if (room.participants.some((p) => Date.now() - (p.lastSeenAt ?? p.connectedAt) > 15000)) throw new RoomActionError('Both players must be connected to start');
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
  membershipToken: string,
  action: 'request' | 'accept' | 'cancel' | 'decline' = 'request',
  requestId?: string
): Promise<{ room: MultiplayerRoom | null; error?: string }> {
  return withRoomMutation(roomCode, async (save) => {
    const room = await requireRound(roomCode, userId, roundId, membershipToken, save);
    if (room.status !== 'finished') throw new RoomActionError('Only finished matches can be reset');
    if (room.participants.length !== 2 || room.participants.some((p) => p.leftAt !== undefined)) throw new RoomActionError('Both players must still be in the room to rematch');
    const pending = room.rematchRequest;
    if (action === 'request') {
      if (pending) return { room }; // Retry or simultaneous requests never imply acceptance.
      room.rematchRequest = { id: randomUUID(), requestedBy: userId };
      room.revision += 1;
      await save(room);
      return { room };
    }
    if (!pending || pending.id !== requestId) throw new RoomActionError('This rematch request has ended. Sync the room.');
    if (action === 'cancel' ? pending.requestedBy !== userId : pending.requestedBy === userId) {
      throw new RoomActionError('You cannot perform this action on this rematch request', 403);
    }
    if (action !== 'accept' && action !== 'cancel' && action !== 'decline') throw new RoomActionError('Invalid rematch action', 400);
    room.rematchRequest = undefined;
    if (action !== 'accept') {
      room.revision += 1;
      await save(room);
      return { room };
    }
    room.finishReason = undefined;
    room.guessedPlayerIdsByUser = {};
    room.hintsByUser = {};
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
    const room = await requireRound(roomCode, userId, roundId, membershipToken, save);
    if (room.status !== 'waiting') return { room: null, error: 'Readiness can only change while waiting' };

    const participant = room.participants.find((item) => item.userId === userId);
    if (!participant) return { room: null, error: 'You are not a member of this room' };

    participant.isReady = !participant.isReady;
    room.revision += 1;
    await save(room);
    return { room };
  });
}


// All callers hold the room mutation lock. Expiry is settled before a late request
// can refresh its own heartbeat, and persisted even when the requested action fails.
async function touchParticipant(room: MultiplayerRoom, participant: RoomParticipant, save: (room: MultiplayerRoom) => Promise<void>) {
  if (Date.now() - (participant.lastSeenAt ?? participant.connectedAt) >= 5000) {
    participant.lastSeenAt = Date.now();
    room.revision += 1;
    await save(room);
  }
}
function finishDeparture(room: MultiplayerRoom, winner?: RoomParticipant) {
  const target = PLAYERS.find((p) => p.id === room.targetPlayerId)!;
  room.status = 'finished';
  room.finishReason = winner ? 'forfeit' : 'abandoned';
  room.finishedAt = Date.now();
  room.countdownEndsAt = undefined;
  room.rematchRequest = undefined;
  room.winnerUserId = winner?.userId;
  room.winnerNickname = winner?.nickname;
  room.reveal = { id: target.id, name: target.name, country: target.country, role: target.role, photoUrl: target.photoUrl };
}
function removeLobbyParticipants(room: MultiplayerRoom, ids: Set<string>) {
  room.participants = room.participants.filter((p) => !ids.has(p.userId));
  room.status = 'waiting';
  room.countdownEndsAt = undefined;
  if (!room.participants.length) { room.closedAt = Date.now(); return; }
  if (ids.has(room.hostId)) {
    const host = room.participants[0];
    host.role = 'host';
    room.hostId = host.userId;
    room.hostName = host.nickname;
    room.promotedHostIds = [...(room.promotedHostIds || []), host.userId];
  }
  room.participants.forEach((p) => { p.isReady = p.role === 'host'; });
}
async function reconcilePresence(room: MultiplayerRoom, save: (room: MultiplayerRoom) => Promise<void>) {
  if (room.closedAt !== undefined || room.status === 'finished') return;
  const expired = room.participants.filter((p) => Date.now() - (p.lastSeenAt ?? p.connectedAt) >= MULTIPLAYER_RECONNECT_MS);
  if (!expired.length) return;
  const ids = new Set(expired.map((p) => p.userId));
  if (room.status === 'in_progress') {
    finishDeparture(room, room.participants.find((p) => !ids.has(p.userId)));
  } else {
    removeLobbyParticipants(room, ids);
  }
  room.revision += 1;
  await save(room);
}

// Promotion can exchange an original guest credential for its new host credential
// only through authenticated synchronization, not by bypassing mutation role checks.
export async function syncRoomForUser(roomCode: string, userId: string, membershipToken: string) {
  return withRoomMutation(roomCode, async (save) => {
    const room = await getStoredRoom(roomCode);
    if (!room) throw new RoomActionError('Room not found', 404);
    assertRoomMembership(room, membershipToken, userId, true);
    await reconcilePresence(room, save);
    const participant = assertRoomMembership(room, membershipToken, userId, true);
    await touchParticipant(room, participant, save);
    return room;
  });
}

export async function leaveRoomForUser(roomCode: string, userId: string, roundId: string, membershipToken: string) {
  return withRoomMutation(roomCode, async (save) => {
    const room = await requireRound(roomCode, userId, roundId, membershipToken, save, true);
    if (room.status === 'waiting' || room.status === 'countdown') {
      removeLobbyParticipants(room, new Set([userId]));
    } else {
      const participant = room.participants.find((p) => p.userId === userId)!;
      participant.leftAt = Date.now();
      room.rematchRequest = undefined;
      if (room.status === 'in_progress') finishDeparture(room, room.participants.find((p) => p.userId !== userId && p.leftAt === undefined));
      if (room.participants.every((p) => p.leftAt !== undefined)) room.closedAt = Date.now();
    }
    room.revision += 1;
    await save(room);
    return { room };
  });
}
