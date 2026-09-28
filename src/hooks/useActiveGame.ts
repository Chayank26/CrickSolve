'use client';

import { GameMode, GameStatus, useGameStore } from '@/store/useGameStore';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import { MULTIPLAYER_HINT_LABELS, MULTIPLAYER_MAX_GUESSES } from '@/types/multiplayer';

// Shared board components read the active mode; only the solo store is persisted.
export function selectActiveGame(solo: ReturnType<typeof useGameStore.getState>, multiplayer: ReturnType<typeof useMultiplayerStore.getState>) {
  const { room, hint, guesses, userId } = multiplayer;
  if (!room) return { ...solo, gameMode: solo.gameMode as GameMode };
  const self = room.participants.find((player) => player.userId === userId);
  const gameStatus: GameStatus = room.status === 'finished'
    ? room.winnerUserId === userId ? 'WON' : 'LOST'
    : (self?.guessesCount || 0) >= MULTIPLAYER_MAX_GUESSES ? 'LOST' : 'IN_PROGRESS';
  return {
    ...solo,
    gameMode: 'multiplayer' as GameMode,
    guesses, gameStatus,
    unlimitedTargetId: null,
    startTimeMs: room.startedAt ?? null,
    endTimeMs: room.finishedAt ?? null,
    sessionToken: null, victoryToken: null, bonusChanceTaken: false,
    unlockedHint: hint ? `${MULTIPLAYER_HINT_LABELS[hint.key]}: ${hint.value}` : null,
    manuallyUnlockedAttributes: hint ? { [hint.key]: hint.value } : {},
    isHintSelecting: multiplayer.isHintSelecting,
    startHintSelection: multiplayer.startHintSelection,
    cancelHintSelection: multiplayer.cancelHintSelection,
  };
}
export function useActiveGame() {
  return selectActiveGame(useGameStore(), useMultiplayerStore());
}
