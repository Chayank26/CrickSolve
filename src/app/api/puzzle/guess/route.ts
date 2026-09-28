import { evaluatePlayerGuess, getDailyTargetPlayer } from '@/lib/game-engine';
import { createSessionToken, createVictoryToken, verifySessionToken } from '@/lib/server-crypto';
import { submitRoomGuess, toMemberRoomResponse } from '@/lib/multiplayer-manager';
import { PlayerCategory } from '@/types/game';
import { RoomActionError } from '@/lib/multiplayer-errors';
import { multiplayerError, multiplayerJson, onlyFields, readJsonObject, readRoomCode, readRoundId, readString, requestMembership } from '@/lib/multiplayer-http';
import { enforceRateLimit, limitMultiplayerRequest } from '@/lib/multiplayer-rate-limit';

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const guessedPlayerId = readString(body.guessedPlayerId, 'player ID', 100);
    const attemptNumber = body.attemptNumber ?? 1;
    if (typeof attemptNumber !== 'number' || !Number.isInteger(attemptNumber) || attemptNumber < 1 || attemptNumber > 8) {
      throw new RoomActionError('Invalid attempt number', 400);
    }
    if (body.roomCode !== undefined || body.mode === 'multiplayer') {
      await limitMultiplayerRequest(request, 'guess-network', 120);
      onlyFields(body, ['roomCode', 'roundId', 'guessedPlayerId', 'attemptNumber', 'mode']);
      const roomCode = readRoomCode(body.roomCode);
      const roundId = readRoundId(body.roundId);
      const { userId, membershipToken, membership } = requestMembership(request, roomCode);
      await enforceRateLimit('guess-member', `${membership.roomId}:${userId}`, 30);
      const result = await submitRoomGuess({ roomCode, userId, roundId, membershipToken, guessedPlayerId, attemptNumber });
      return multiplayerJson({
        evaluation: result.evaluation, solveTimeMs: result.solveTimeMs,
        mode: 'multiplayer', attemptNumber, ...toMemberRoomResponse(result.room, userId), multiplayerReveal: result.room.reveal,
      });
    }

    const todayStr = body.date === undefined ? new Date().toISOString().split('T')[0] : readString(body.date, 'date', 10);
    const category = (body.category ?? 'International') as PlayerCategory;
    if (!['International', 'IPL', 'Legend', 'Womens'].includes(category)) throw new RoomActionError('Invalid category', 400);
    const mode = body.mode ?? 'daily';
    if (mode !== 'daily' && mode !== 'unlimited') throw new RoomActionError('Invalid mode', 400);
    const userId = body.userId === undefined ? 'user_anon' : readString(body.userId, 'user ID', 100);
    let activeSessionToken = typeof body.sessionToken === 'string' ? body.sessionToken : '';
    let session = verifySessionToken(activeSessionToken);
    if (!session) {
      activeSessionToken = createSessionToken(todayStr, category, mode, Date.now());
      session = verifySessionToken(activeSessionToken);
    }
    const targetId = mode === 'daily' ? getDailyTargetPlayer(todayStr, category).id : readString(body.targetPlayerId, 'target player ID', 100);
    const evaluation = evaluatePlayerGuess(guessedPlayerId, targetId, attemptNumber);
    if (!evaluation) throw new RoomActionError('Invalid player ID', 404);
    const solveTimeMs = evaluation.isCorrect ? Math.max(1000, Date.now() - (session?.startTimeMs ?? Date.now())) : undefined;
    const victoryToken = solveTimeMs === undefined ? undefined : createVictoryToken(todayStr, category, attemptNumber, solveTimeMs, userId);
    return multiplayerJson({ evaluation, sessionToken: activeSessionToken, victoryToken, solveTimeMs, mode, attemptNumber });
  } catch (error) { return multiplayerError(error); }
}
