export type BattingHand = 'Right-hand bat' | 'Left-hand bat';
export type BowlingType = 
  | 'Right-arm fast' 
  | 'Right-arm medium' 
  | 'Right-arm offbreak' 
  | 'Legbreak' 
  | 'Left-arm fast' 
  | 'Left-arm orthodox' 
  | 'Left-arm chinaman' 
  | 'None';

export type PlayerRole = 'Batter' | 'Bowler' | 'All-rounder' | 'Wicketkeeper batter';

export type PlayerCategory = 'International' | 'IPL' | 'Legend' | 'Womens';

export interface Player {
  id: string;
  name: string;
  country: string;
  battingHand: BattingHand;
  bowlingType: BowlingType;
  role: PlayerRole;
  iplTeam: string;
  retired: boolean;
  birthYear: number;
  tests: number;
  odis: number;
  t20is: number;
  category: PlayerCategory;
  photoUrl: string;
  jerseyNumber?: number;
  debutYear?: number;
  famousTeammate?: string;
  signaturePerformance?: string;
}

export type NumericComparison = 'higher' | 'lower' | 'match';

export interface AttributeMatchResult {
  country: boolean;
  battingHand: boolean;
  bowlingType: boolean;
  role: boolean;
  iplTeam: boolean;
  retired: boolean;
}

export interface NumericMatchResult {
  birthYear: NumericComparison;
  tests: NumericComparison;
  odis: NumericComparison;
  t20is: NumericComparison;
}

export interface GuessEvaluation {
  guessedPlayer: Player;
  isCorrect: boolean;
  attributeMatches: AttributeMatchResult;
  numericMatches: NumericMatchResult;
  unlockedHint?: {
    type: 'jerseyNumber' | 'famousTeammate' | 'signaturePerformance';
    value: string | number;
  };
}

export interface DailyPuzzle {
  date: string; // YYYY-MM-DD
  playerId: string;
  category: PlayerCategory;
}

export interface LeaderboardEntry {
  id: string;
  date: string;
  userId: string;
  nickname: string;
  attempts: number;
  timeMs?: number;
  time_ms?: number;
  createdAt?: string;
  created_at?: string;
}

export interface UserStats {
  userId: string;
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: Record<number, number>; // e.g. {1: 0, 2: 3, 3: 5, ...}
}
