import { joinRoom, toPublicRoom } from '@/lib/multiplayer-manager';
import { createMultiplayerMembershipToken } from '@/lib/server-crypto';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomCode, userId, nickname } = body;

    if (!roomCode || !userId) {
      return NextResponse.json({ error: 'roomCode and userId are required' }, { status: 400 });
    }

    const { room, error } = await joinRoom(roomCode, userId, nickname || 'Guest Cricketer');

    if (error || !room) {
      return NextResponse.json({ error: error || 'Failed to join room' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      room: toPublicRoom(room),
      membershipToken: createMultiplayerMembershipToken(room.roomCode, userId, 'guest'),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to join room';
    if (message === 'ROOM_BUSY') {
      return NextResponse.json({ error: 'Another room action is being processed. Please retry.' }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
