import { getFilteredPlayers } from '@/lib/game-engine';
import { PlayerCategory } from '@/types/game';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = (searchParams.get('category') as PlayerCategory) || 'International';

  const pool = getFilteredPlayers(category);
  const randomIndex = Math.floor(Math.random() * pool.length);
  const selectedPlayer = pool[randomIndex];

  return NextResponse.json({
    targetPlayerId: selectedPlayer.id,
    category,
    poolSize: pool.length,
  });
}
