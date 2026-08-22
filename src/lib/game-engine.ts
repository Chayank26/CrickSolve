import { PLAYERS } from '@/data/players';
import { AttributeMatchResult, GuessEvaluation, NumericComparison, NumericMatchResult, Player, PlayerCategory } from '@/types/game';

// Hash date string + category to pick a deterministic index for daily puzzle
export function getDailyPlayerIndex(dateStr: string, category: PlayerCategory = 'International', listLength: number): number {
  const seed = `${dateStr}-${category}-cricksolve-salt-2026`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash) % listLength;
}

export function getFilteredPlayers(category: PlayerCategory = 'International'): Player[] {
  if (category === 'International') {
    return PLAYERS;
  }
  return PLAYERS.filter((p) => p.category === category || (category === 'IPL' && p.iplTeam !== 'None'));
}

export function getDailyTargetPlayer(dateStr: string, category: PlayerCategory = 'International'): Player {
  const pool = getFilteredPlayers(category);
  const targetPool = pool.length > 0 ? pool : PLAYERS;
  const index = getDailyPlayerIndex(dateStr, category, targetPool.length);
  return targetPool[index];
}

export function compareNumeric(guessedValue: number, targetValue: number): NumericComparison {
  if (guessedValue === targetValue) return 'match';
  return guessedValue < targetValue ? 'higher' : 'lower';
}

export function evaluatePlayerGuess(
  guessedPlayerId: string,
  targetPlayerId: string,
  attemptNumber: number
): GuessEvaluation | null {
  const guessedPlayer = PLAYERS.find((p) => p.id === guessedPlayerId);
  const targetPlayer = PLAYERS.find((p) => p.id === targetPlayerId);

  if (!guessedPlayer || !targetPlayer) return null;

  const isCorrect = guessedPlayer.id === targetPlayer.id;

  const attributeMatches: AttributeMatchResult = {
    country: guessedPlayer.country === targetPlayer.country,
    battingHand: guessedPlayer.battingHand === targetPlayer.battingHand,
    bowlingType: guessedPlayer.bowlingType === targetPlayer.bowlingType,
    role: guessedPlayer.role === targetPlayer.role,
    iplTeam: guessedPlayer.iplTeam === targetPlayer.iplTeam,
    retired: guessedPlayer.retired === targetPlayer.retired,
  };

  const numericMatches: NumericMatchResult = {
    birthYear: compareNumeric(guessedPlayer.birthYear, targetPlayer.birthYear),
    tests: compareNumeric(guessedPlayer.tests, targetPlayer.tests),
    odis: compareNumeric(guessedPlayer.odis, targetPlayer.odis),
    t20is: compareNumeric(guessedPlayer.t20is, targetPlayer.t20is),
  };

  let unlockedHint: GuessEvaluation['unlockedHint'] = undefined;

  // Grant tactical hint on attempt 4 or higher if not already won
  if (attemptNumber >= 4 && !isCorrect) {
    if (targetPlayer.jerseyNumber) {
      unlockedHint = { type: 'jerseyNumber', value: `Jersey #${targetPlayer.jerseyNumber}` };
    } else if (targetPlayer.famousTeammate) {
      unlockedHint = { type: 'famousTeammate', value: `Famous Teammate: ${targetPlayer.famousTeammate}` };
    } else if (targetPlayer.signaturePerformance) {
      unlockedHint = { type: 'signaturePerformance', value: targetPlayer.signaturePerformance };
    }
  }

  return {
    guessedPlayer,
    isCorrect,
    attributeMatches,
    numericMatches,
    unlockedHint,
  };
}
