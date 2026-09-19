import { getRoom, rematchRoomForUser, toPublicRoom, toggleReadyForUser, updateRoomStatusForUser } from '@/lib/multiplayer-manager';
import { verifyMultiplayerMembershipToken } from '@/lib/server-crypto';
import { RoomStatus } from '@/types/multiplayer';
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
    const message = err instanceof Error ? err.message : 'Failed to fetch room';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { roomCode, action, status, userId, membershipToken } = body;

    if (!roomCode) {
      return NextResponse.json({ error: 'Room code is required' }, { status: 400 });
    }

    if (!userId || !membershipToken || !verifyMultiplayerMembershipToken(membershipToken, roomCode, userId)) {
      return NextResponse.json({ error: 'Valid room membership is required' }, { status: 401 });
    }

    if (action === 'rematch') {
      const result = await rematchRoomForUser(roomCode, userId);
      if (result.error || !result.room) {
        return NextResponse.json({ error: result.error || 'Unable to start rematch' }, { status: 403 });
      }
      const room = result.room;
      return NextResponse.json({ success: true, room: toPublicRoom(room) });
    }

    if (action === 'ready') {
      const result = await toggleReadyForUser(roomCode, userId);
      if (result.error || !result.room) {
        return NextResponse.json({ error: result.error || 'Unable to update readiness' }, { status: 403 });
      }
      return NextResponse.json({ success: true, room: toPublicRoom(result.room) });
    }

    if (status) {
      const result = await updateRoomStatusForUser(roomCode, userId, status as RoomStatus);
      if (result.error || !result.room) {
        return NextResponse.json({ error: result.error || 'Unable to update room' }, { status: 403 });
      }
      const room = result.room;
      return NextResponse.json({ success: true, room: toPublicRoom(room) });
    }

    return NextResponse.json({ error: 'Invalid action or status' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update room';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
