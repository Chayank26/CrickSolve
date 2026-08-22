import { getFilteredPlayers } from '@/lib/game-engine';
import { PlayerCategory } from '@/types/game';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const category = (searchParams.get('category') as PlayerCategory) || 'International';

  const pool = getFilteredPlayers(category);

  return NextResponse.json({
    date: dateStr,
    category,
    totalPlayers: pool.length,
    status: 'active',
  });
}
