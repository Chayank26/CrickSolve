import { evaluatePlayerGuess, getDailyTargetPlayer } from '@/lib/game-engine';
import { PlayerCategory } from '@/types/game';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { guessedPlayerId, date, category = 'International', mode = 'daily', targetPlayerId, attemptNumber = 1 } = body;

    if (!guessedPlayerId) {
      return NextResponse.json({ error: 'guessedPlayerId is required' }, { status: 400 });
    }

    const todayStr = date || new Date().toISOString().split('T')[0];
    let actualTargetId = targetPlayerId;

    if (mode === 'daily') {
      const targetPlayer = getDailyTargetPlayer(todayStr, category as PlayerCategory);
      actualTargetId = targetPlayer.id;
    }

    if (!actualTargetId) {
      return NextResponse.json({ error: 'Target player could not be determined' }, { status: 400 });
    }

    const evaluation = evaluatePlayerGuess(guessedPlayerId, actualTargetId, attemptNumber);

    if (!evaluation) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 404 });
    }

    return NextResponse.json({
      evaluation,
      mode,
      attemptNumber,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Server evaluation failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
