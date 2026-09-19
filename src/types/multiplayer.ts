import { AttributeMatchResult, NumericMatchResult } from './game';

export type RoomStatus = 'waiting' | 'countdown' | 'in_progress' | 'finished';

export type ParticipantRole = 'host' | 'guest';

export interface RoomParticipant {
  userId: string;
  nickname: string;
  role: ParticipantRole;
  isReady: boolean;
  guessesCount: number;
  isSolved: boolean;
  solveTimeMs?: number;
  recentGuessMatches?: {
    attributeMatches: AttributeMatchResult;
    numericMatches: NumericMatchResult;
  };
  connectedAt: number;
}

export interface MultiplayerRoom {
  id: string;
  roomCode: string;
  hostId: string;
  hostName: string;
  status: RoomStatus;
  targetPlayerId: string;
  participants: RoomParticipant[];
  createdAt: number;
  roundId: string;
  revision: number;
  startedAt?: number;
  finishedAt?: number;
  winnerUserId?: string;
  winnerNickname?: string;
}

export type PublicMultiplayerRoom = Omit<MultiplayerRoom, 'targetPlayerId'>;

export interface MultiplayerReveal {
  id: string;
  name: string;
  country: string;
  role: string;
  photoUrl: string;
}

// Supabase Realtime Broadcast Payloads
export interface RealtimeOpponentGuessPayload {
  roomCode: string;
  roundId: string;
  revision: number;
  userId: string;
  guessNumber: number;
  attributeMatches: AttributeMatchResult;
  numericMatches: NumericMatchResult;
  isCorrect: boolean;
}

export interface RealtimeCountdownPayload {
  roomCode: string;
  roundId: string;
  revision: number;
  countdownSeconds: number;
  targetStartTimeMs: number;
}

export interface RealtimeMatchFinishPayload {
  roomCode: string;
  roundId: string;
  revision: number;
  winnerUserId: string;
  winnerNickname: string;
  tries: number;
  solveTimeMs: number;
  reveal?: MultiplayerReveal;
}

export interface RealtimeRematchPayload {
  roomCode: string;
  roundId: string;
  revision: number;
  timestamp: number;
}

export interface RealtimeRoomUpdatePayload {
  roomCode: string;
  roundId: string;
  revision: number;
  room: PublicMultiplayerRoom;
}
