import { createRoom } from '@/lib/multiplayer-manager';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hostId, hostName } = body;

    if (!hostId) {
      return NextResponse.json({ error: 'hostId is required' }, { status: 400 });
    }

    const room = createRoom(hostId, hostName || 'Host Cricketer');

    return NextResponse.json({
      success: true,
      room,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create room';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
