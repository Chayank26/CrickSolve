import { evaluatePlayerGuess, getDailyTargetPlayer } from '@/lib/game-engine';
import { PLAYERS } from '@/data/players';
import {
  createSessionToken,
  createVictoryToken,
  verifyMultiplayerMembershipToken,
  verifySessionToken,
} from '@/lib/server-crypto';
import { getRoom, recordRoomGuess, toPublicRoom } from '@/lib/multiplayer-manager';
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
      roomCode,
      membershipToken,
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

    // 2. Resolve multiplayer target and attempt sequence server-side
    let actualTargetId = targetPlayerId;
    let multiplayerRoomCode: string | null = null;
    let multiplayerTargetPlayer = null;
    let updatedRoom = null;
    if (roomCode) {
      if (!membershipToken || !verifyMultiplayerMembershipToken(membershipToken, roomCode, userId)) {
        return NextResponse.json({ error: 'Valid room membership is required' }, { status: 401 });
      }

      const room = await getRoom(roomCode);
      const participant = room?.participants.find((item) => item.userId === userId);
      if (!room || !participant) {
        return NextResponse.json({ error: 'You are not a member of this room' }, { status: 403 });
      }
      if (room.status !== 'in_progress') {
        return NextResponse.json({ error: 'The match is not active' }, { status: 409 });
      }
      if (attemptNumber !== participant.guessesCount + 1) {
        return NextResponse.json({ error: 'Invalid attempt number' }, { status: 409 });
      }

      actualTargetId = room.targetPlayerId;
      multiplayerRoomCode = roomCode;
      multiplayerTargetPlayer = PLAYERS.find((player) => player.id === actualTargetId) || null;
    }

    if (mode === 'daily' && !roomCode) {
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

    if (multiplayerRoomCode) {
      updatedRoom = await recordRoomGuess(
        multiplayerRoomCode,
        userId,
        evaluation.isCorrect,
        evaluation.attributeMatches,
        evaluation.numericMatches
      );
      if (!updatedRoom) {
        return NextResponse.json({ error: 'Unable to persist the multiplayer guess' }, { status: 503 });
      }
      if (multiplayerTargetPlayer) {
        evaluation.revealedAttributes = {
          country: evaluation.attributeMatches.country ? multiplayerTargetPlayer.country : undefined,
          battingHand: evaluation.attributeMatches.battingHand ? multiplayerTargetPlayer.battingHand : undefined,
          bowlingType: evaluation.attributeMatches.bowlingType ? multiplayerTargetPlayer.bowlingType : undefined,
          role: evaluation.attributeMatches.role ? multiplayerTargetPlayer.role : undefined,
          iplTeam: evaluation.attributeMatches.iplTeam ? multiplayerTargetPlayer.iplTeam : undefined,
          retired: evaluation.attributeMatches.retired ? (multiplayerTargetPlayer.retired ? 'YES' : 'NO') : undefined,
        };
      }
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
      room: multiplayerRoomCode && updatedRoom ? toPublicRoom(updatedRoom) : undefined,
      multiplayerReveal:
        multiplayerRoomCode && multiplayerTargetPlayer && evaluation.isCorrect
          ? {
              id: multiplayerTargetPlayer.id,
              name: multiplayerTargetPlayer.name,
              country: multiplayerTargetPlayer.country,
              role: multiplayerTargetPlayer.role,
              photoUrl: multiplayerTargetPlayer.photoUrl,
            }
          : undefined,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Server evaluation failed';
    if (errorMessage === 'ROOM_BUSY') {
      return NextResponse.json({ error: 'Another room action is being processed. Please retry.' }, { status: 409 });
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

