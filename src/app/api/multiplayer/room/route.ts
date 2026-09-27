import { RoomActionError, getRoom, rematchRoomForUser, toPublicRoom, toggleReadyForUser, updateRoomStatusForUser } from '@/lib/multiplayer-manager';
import { verifyMultiplayerMembershipToken } from '@/lib/server-crypto';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const userId = searchParams.get('userId');
    const membershipToken = searchParams.get('membershipToken');

    if (!code) {
      return NextResponse.json({ error: 'Room code is required' }, { status: 400 });
    }

    if (!userId || !membershipToken || !verifyMultiplayerMembershipToken(membershipToken, code, userId)) {
      return NextResponse.json({ error: 'Valid room membership is required' }, { status: 401 });
    }

    const room = await getRoom(code);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      room: toPublicRoom(room),
    });
  } catch (err: unknown) {
    if (err instanceof RoomActionError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof SyntaxError) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    const message = err instanceof Error ? err.message : 'Failed to fetch room';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'A JSON object is required' }, { status: 400 });
    }
    const { roomCode, action, status, userId, membershipToken, roundId } = body;

    if (typeof roomCode !== 'string' || !roomCode.trim() || typeof roundId !== 'string' || !roundId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Room code, user ID and round ID are required' }, { status: 400 });
    }
    if ((action && status) || (action && action !== 'ready' && action !== 'rematch') || (status && status !== 'countdown' && status !== 'in_progress')) {
      return NextResponse.json({ error: 'Invalid action or status' }, { status: 400 });
    }

    if (!userId || !membershipToken || !verifyMultiplayerMembershipToken(membershipToken, roomCode, userId)) {
      return NextResponse.json({ error: 'Valid room membership is required' }, { status: 401 });
    }

    if (action === 'rematch') {
      const result = await rematchRoomForUser(roomCode, userId, roundId, membershipToken);
      if (result.error || !result.room) {
        return NextResponse.json({ error: result.error || 'Unable to start rematch' }, { status: 403 });
      }
      const room = result.room;
      return NextResponse.json({ success: true, room: toPublicRoom(room) });
    }

    if (action === 'ready') {
      const result = await toggleReadyForUser(roomCode, userId, roundId, membershipToken);
      if (result.error || !result.room) {
        return NextResponse.json({ error: result.error || 'Unable to update readiness' }, { status: 403 });
      }
      return NextResponse.json({ success: true, room: toPublicRoom(result.room) });
    }

    if (status) {
      const result = await updateRoomStatusForUser(roomCode, userId, status, roundId, membershipToken);
      if (result.error || !result.room) {
        return NextResponse.json({ error: result.error || 'Unable to update room' }, { status: 403 });
      }
      const room = result.room;
      return NextResponse.json({ success: true, room: toPublicRoom(room) });
    }

    return NextResponse.json({ error: 'Invalid action or status' }, { status: 400 });
  } catch (err: unknown) {
    if (err instanceof RoomActionError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof SyntaxError) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    const message = err instanceof Error ? err.message : 'Failed to update room';
    if (message === 'ROOM_BUSY') {
      return NextResponse.json({ error: 'Another room action is being processed. Please retry.' }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
