import { createMultiplayerMembershipToken } from '@/lib/server-crypto';
import { MULTIPLAYER_HINT_LABELS, MultiplayerHintKey } from '@/types/multiplayer';
import { claimRoomHint, leaveRoomForUser, syncRoomForUser, rematchRoomForUser, toMemberRoomResponse, toggleReadyForUser, updateRoomStatusForUser } from '@/lib/multiplayer-manager';
import { RoomActionError } from '@/lib/multiplayer-errors';
import { multiplayerError, multiplayerJson, onlyFields, readJsonObject, readRoomCode, readRoundId, requestMembership } from '@/lib/multiplayer-http';
import { enforceRateLimit, limitMultiplayerRequest } from '@/lib/multiplayer-rate-limit';

export async function GET(request: Request) {
  try {
    await limitMultiplayerRequest(request, 'read-network', 600);
    const code = readRoomCode(new URL(request.url).searchParams.get('code'));
    const { userId, membershipToken, membership } = requestMembership(request, code);
    await enforceRateLimit('read-member', `${membership.roomId}:${userId}`, 180);
    const room = await syncRoomForUser(code, userId, membershipToken);
    const role = room.participants.find((p) => p.userId === userId)!.role;
    return multiplayerJson({ success: true, ...toMemberRoomResponse(room, userId),
      ...(role !== membership.role ? { membershipToken: createMultiplayerMembershipToken(room, userId, role, membership.expiresAt) } : {}),
    });
  } catch (error) { return multiplayerError(error); }
}

export async function PATCH(request: Request) {
  try {
    await limitMultiplayerRequest(request, 'mutation-network', 120);
    const body = await readJsonObject(request);
    onlyFields(body, ['roomCode', 'roundId', 'action', 'status', 'attribute', 'rematchAction', 'rematchRequestId']);
    const roomCode = readRoomCode(body.roomCode);
    const roundId = readRoundId(body.roundId);
    const { userId, membershipToken, membership } = requestMembership(request, roomCode);
    await enforceRateLimit('mutation-member', `${membership.roomId}:${userId}`, 30);
    const { action, status } = body;
    if ((action !== undefined && status !== undefined) ||
        (action !== undefined && action !== 'ready' && action !== 'rematch' && action !== 'hint' && action !== 'leave') ||
        (status !== undefined && status !== 'countdown' && status !== 'in_progress')) {
      throw new RoomActionError('Invalid action or status', 400);
    }
    if (action === 'hint' && (typeof body.attribute !== 'string' || !Object.hasOwn(MULTIPLAYER_HINT_LABELS, body.attribute))) {
      throw new RoomActionError('Invalid hint attribute', 400);
    }
    if (action !== 'hint' && body.attribute !== undefined) throw new RoomActionError('Unexpected hint attribute', 400);
    if (action !== 'rematch' && (body.rematchAction !== undefined || body.rematchRequestId !== undefined)) throw new RoomActionError('Unexpected rematch fields', 400);
    const rematchAction = body.rematchAction ?? 'request';
    if (action === 'rematch' && !['request', 'accept', 'cancel', 'decline'].includes(rematchAction as string)) throw new RoomActionError('Invalid rematch action', 400);
    const rematchRequestId = action === 'rematch' && rematchAction !== 'request' ? readRoundId(body.rematchRequestId) : undefined;
    if (action === 'rematch' && rematchAction === 'request' && body.rematchRequestId !== undefined) throw new RoomActionError('Unexpected rematch request ID', 400);
    if (action === 'leave') {
      await leaveRoomForUser(roomCode, userId, roundId, membershipToken);
      return multiplayerJson({ success: true });
    }
    const result = action === 'hint'
      ? await claimRoomHint(roomCode, userId, roundId, membershipToken, body.attribute as MultiplayerHintKey)
      : action === 'ready'
      ? await toggleReadyForUser(roomCode, userId, roundId, membershipToken)
      : action === 'rematch'
      ? await rematchRoomForUser(roomCode, userId, roundId, membershipToken, rematchAction as 'request' | 'accept' | 'cancel' | 'decline', rematchRequestId)
      : status === 'countdown' || status === 'in_progress'
      ? await updateRoomStatusForUser(roomCode, userId, status, roundId, membershipToken)
      : null;
    if (!result) throw new RoomActionError('Invalid action or status', 400);
    if (!result.room || result.error) throw new RoomActionError(result.error || 'Unable to update room', 403);
    return multiplayerJson({ success: true, ...toMemberRoomResponse(result.room, userId) });
  } catch (error) { return multiplayerError(error); }
}
