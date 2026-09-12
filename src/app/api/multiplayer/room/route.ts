import { getRoom, rematchRoom, updateRoomStatus } from '@/lib/multiplayer-manager';
import { RoomStatus } from '@/types/multiplayer';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Room code is required' }, { status: 400 });
    }

    const room = getRoom(code);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      room,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch room';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { roomCode, action, status } = body;

    if (!roomCode) {
      return NextResponse.json({ error: 'Room code is required' }, { status: 400 });
    }

    if (action === 'rematch') {
      const room = rematchRoom(roomCode);
      if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      return NextResponse.json({ success: true, room });
    }

    if (status) {
      const room = updateRoomStatus(roomCode, status as RoomStatus);
      if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      return NextResponse.json({ success: true, room });
    }

    return NextResponse.json({ error: 'Invalid action or status' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update room';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
