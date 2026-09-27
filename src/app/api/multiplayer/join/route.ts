import { randomUUID } from 'crypto';
import { joinRoom, toPublicRoom } from '@/lib/multiplayer-manager';
import { createMultiplayerMembershipToken } from '@/lib/server-crypto';
import { multiplayerError, multiplayerJson, onlyFields, readJsonObject, readRoomCode, readString, requestMembership } from '@/lib/multiplayer-http';
import { limitMultiplayerRequest } from '@/lib/multiplayer-rate-limit';
import { RoomActionError } from '@/lib/multiplayer-errors';

export async function POST(request: Request) {
  try {
    await limitMultiplayerRequest(request, 'join', 30);
    const body = await readJsonObject(request);
    onlyFields(body, ['roomCode', 'nickname']);
    const roomCode = readRoomCode(body.roomCode);
    const nickname = readString(body.nickname ?? 'Guest Cricketer', 'nickname', 20);
    // Reclaiming an existing slot requires its credential; fresh joins get a new identity.
    const identity = request.headers.has('authorization') ? requestMembership(request, roomCode) : null;
    const userId = identity?.userId || randomUUID();
    const { room, error } = await joinRoom(roomCode, userId, nickname, identity?.membershipToken);
    if (!room || error) throw new RoomActionError(error || 'Unable to join room', 409);
    const participant = room.participants.find((item) => item.userId === userId)!;
    return multiplayerJson({
      success: true, userId, room: toPublicRoom(room),
      membershipToken: createMultiplayerMembershipToken(room, userId, participant.role),
    });
  } catch (error) { return multiplayerError(error); }
}
