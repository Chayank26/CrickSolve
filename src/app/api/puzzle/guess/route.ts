import { evaluatePlayerGuess, getDailyTargetPlayer } from '@/lib/game-engine';
import { createSessionToken, createVictoryToken, verifySessionToken } from '@/lib/server-crypto';
import { PlayerCategory } from '@/types/game';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      guessedPlayerId,
      date,
      category = 'International',
      mode = 'daily',
      targetPlayerId,
      attemptNumber = 1,
      sessionToken: clientSessionToken,
      userId = 'user_anon',
    } = body;

    if (!guessedPlayerId) {
      return NextResponse.json({ error: 'guessedPlayerId is required' }, { status: 400 });
    }

    const todayStr = date || new Date().toISOString().split('T')[0];
    const cat = category as PlayerCategory;

    // 1. Verify or create session token
    let session = clientSessionToken ? verifySessionToken(clientSessionToken) : null;
    let activeSessionToken = clientSessionToken;

    if (!session) {
      const now = Date.now();
      activeSessionToken = createSessionToken(todayStr, cat, mode, now);
      session = verifySessionToken(activeSessionToken);
    }

    const startTimeMs = session ? session.startTimeMs : Date.now();

    // 2. Resolve target player server-side
    let actualTargetId = targetPlayerId;
    if (mode === 'daily') {
      const targetPlayer = getDailyTargetPlayer(todayStr, cat);
      actualTargetId = targetPlayer.id;
    }

    if (!actualTargetId) {
      return NextResponse.json({ error: 'Target player could not be determined' }, { status: 400 });
    }

    // 3. Evaluate guess privately on server
    const evaluation = evaluatePlayerGuess(guessedPlayerId, actualTargetId, attemptNumber);

    if (!evaluation) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 404 });
    }

    // 4. If win, issue encrypted victory token and calculate solve time
    let victoryToken: string | undefined = undefined;
    let solveTimeMs: number | undefined = undefined;

    if (evaluation.isCorrect) {
      solveTimeMs = Math.max(1000, Date.now() - startTimeMs);
      victoryToken = createVictoryToken(todayStr, cat, attemptNumber, solveTimeMs, userId);
    }

    return NextResponse.json({
      evaluation,
      sessionToken: activeSessionToken,
      victoryToken,
      solveTimeMs,
      mode,
      attemptNumber,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Server evaluation failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

