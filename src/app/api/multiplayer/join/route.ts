import { joinRoom } from '@/lib/multiplayer-manager';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomCode, userId, nickname } = body;

    if (!roomCode || !userId) {
      return NextResponse.json({ error: 'roomCode and userId are required' }, { status: 400 });
    }

    const { room, error } = joinRoom(roomCode, userId, nickname || 'Guest Cricketer');

    if (error || !room) {
      return NextResponse.json({ error: error || 'Failed to join room' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      room,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to join room';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
