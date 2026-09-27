import { assertRoomMembership, getRoom, rematchRoomForUser, toPublicRoom, toggleReadyForUser, updateRoomStatusForUser } from '@/lib/multiplayer-manager';
import { RoomActionError } from '@/lib/multiplayer-errors';
import { multiplayerError, multiplayerJson, onlyFields, readJsonObject, readRoomCode, readRoundId, requestMembership } from '@/lib/multiplayer-http';
import { enforceRateLimit, limitMultiplayerRequest } from '@/lib/multiplayer-rate-limit';

export async function GET(request: Request) {
  try {
    await limitMultiplayerRequest(request, 'read-network', 600);
    const code = readRoomCode(new URL(request.url).searchParams.get('code'));
    const { userId, membershipToken, membership } = requestMembership(request, code);
    await enforceRateLimit('read-member', `${membership.roomId}:${userId}`, 180);
    const room = await getRoom(code);
    if (!room) throw new RoomActionError('Room not found', 404);
    assertRoomMembership(room, membershipToken, userId);
    return multiplayerJson({ success: true, room: toPublicRoom(room) });
  } catch (error) { return multiplayerError(error); }
}

export async function PATCH(request: Request) {
  try {
    await limitMultiplayerRequest(request, 'mutation-network', 120);
    const body = await readJsonObject(request);
    onlyFields(body, ['roomCode', 'roundId', 'action', 'status']);
    const roomCode = readRoomCode(body.roomCode);
    const roundId = readRoundId(body.roundId);
    const { userId, membershipToken, membership } = requestMembership(request, roomCode);
    await enforceRateLimit('mutation-member', `${membership.roomId}:${userId}`, 30);
    const { action, status } = body;
    if ((action !== undefined && status !== undefined) ||
        (action !== undefined && action !== 'ready' && action !== 'rematch') ||
        (status !== undefined && status !== 'countdown' && status !== 'in_progress')) {
      throw new RoomActionError('Invalid action or status', 400);
    }
    const result = action === 'ready'
      ? await toggleReadyForUser(roomCode, userId, roundId, membershipToken)
      : action === 'rematch'
      ? await rematchRoomForUser(roomCode, userId, roundId, membershipToken)
      : status === 'countdown' || status === 'in_progress'
      ? await updateRoomStatusForUser(roomCode, userId, status, roundId, membershipToken)
      : null;
    if (!result) throw new RoomActionError('Invalid action or status', 400);
    if (!result.room || result.error) throw new RoomActionError(result.error || 'Unable to update room', 403);
    return multiplayerJson({ success: true, room: toPublicRoom(result.room) });
  } catch (error) { return multiplayerError(error); }
}
