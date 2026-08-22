import { PLAYERS } from '@/data/players';
import { GuessEvaluation, PlayerCategory } from '@/types/game';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type GameMode = 'daily' | 'unlimited';
export type GameStatus = 'IN_PROGRESS' | 'WON' | 'LOST';

interface GameState {
  // Config & Mode
  gameMode: GameMode;
  category: PlayerCategory;
  currentDate: string;
  unlimitedTargetId: string | null;

  // Active Game Progress
  guesses: GuessEvaluation[];
  gameStatus: GameStatus;
  bonusChanceTaken: boolean;
  unlockedHint: string | null;
  startTimeMs: number | null;
  endTimeMs: number | null;

  // Sound & Preferences
  soundEnabled: boolean;

  // User Stats & Streaks
  streak: number;
  maxStreak: number;
  gamesPlayed: number;
  gamesWon: number;

  // Modals
  activeModal: 'howTo' | 'stats' | 'calendar' | 'share' | 'result' | null;

  // Actions
  setGameMode: (mode: GameMode) => void;
  setCategory: (category: PlayerCategory) => void;
  addGuess: (evaluation: GuessEvaluation) => void;
  enableBonusChance: () => void;
  unlockHintManually: () => void;
  toggleSound: () => void;
  setActiveModal: (modal: 'howTo' | 'stats' | 'calendar' | 'share' | 'result' | null) => void;
  resetGame: (newTargetId?: string) => void;
  syncDailyDate: (dateStr: string) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      gameMode: 'daily',
      category: 'International',
      currentDate: new Date().toISOString().split('T')[0],
      unlimitedTargetId: null,

      guesses: [],
      gameStatus: 'IN_PROGRESS',
      bonusChanceTaken: false,
      unlockedHint: null,
      startTimeMs: null,
      endTimeMs: null,

      soundEnabled: true,

      streak: 0,
      maxStreak: 0,
      gamesPlayed: 0,
      gamesWon: 0,

      activeModal: null,

      setGameMode: (mode) => {
        set({ gameMode: mode, guesses: [], gameStatus: 'IN_PROGRESS', unlockedHint: null, startTimeMs: Date.now() });
      },

      setCategory: (category) => {
        set({ category, guesses: [], gameStatus: 'IN_PROGRESS', unlockedHint: null, startTimeMs: Date.now() });
      },

      addGuess: (evaluation) => {
        const { guesses, gameStatus, streak, maxStreak, gamesPlayed, gamesWon, startTimeMs } = get();
        if (gameStatus !== 'IN_PROGRESS') return;

        const updatedGuesses = [...guesses, evaluation];
        const now = Date.now();
        const start = startTimeMs || now;

        let newStatus: GameStatus = 'IN_PROGRESS';
        let newStreak = streak;
        let newMaxStreak = maxStreak;
        let newGamesPlayed = gamesPlayed;
        let newGamesWon = gamesWon;

        if (evaluation.isCorrect) {
          newStatus = 'WON';
          newStreak = streak + 1;
          newMaxStreak = Math.max(newStreak, maxStreak);
          newGamesPlayed = gamesPlayed + 1;
          newGamesWon = gamesWon + 1;
        } else if (updatedGuesses.length >= (get().bonusChanceTaken ? 8 : 7)) {
          newStatus = 'LOST';
          newStreak = 0;
          newGamesPlayed = gamesPlayed + 1;
        }

        set({
          guesses: updatedGuesses,
          gameStatus: newStatus,
          startTimeMs: start,
          endTimeMs: newStatus !== 'IN_PROGRESS' ? now : null,
          streak: newStreak,
          maxStreak: newMaxStreak,
          gamesPlayed: newGamesPlayed,
          gamesWon: newGamesWon,
          activeModal: newStatus !== 'IN_PROGRESS' ? 'result' : get().activeModal,
        });
      },

      enableBonusChance: () => {
        set({ bonusChanceTaken: true, gameStatus: 'IN_PROGRESS' });
      },

      unlockHintManually: () => {
        const { guesses, unlockedHint } = get();
        if (unlockedHint || guesses.length < 4) return;
        // Take the latest evaluation hint if available
        const lastWithHint = guesses.slice().reverse().find((g) => g.unlockedHint);
        if (lastWithHint?.unlockedHint) {
          set({ unlockedHint: String(lastWithHint.unlockedHint.value) });
        } else {
          set({ unlockedHint: 'Hint: Player is a top international performer' });
        }
      },

      toggleSound: () => {
        set((state) => ({ soundEnabled: !state.soundEnabled }));
      },

      setActiveModal: (modal) => {
        set({ activeModal: modal });
      },

      resetGame: (newTargetId) => {
        set({
          guesses: [],
          gameStatus: 'IN_PROGRESS',
          bonusChanceTaken: false,
          unlockedHint: null,
          startTimeMs: Date.now(),
          endTimeMs: null,
          unlimitedTargetId: newTargetId || null,
        });
      },

      syncDailyDate: (dateStr) => {
        const { currentDate } = get();
        if (currentDate !== dateStr) {
          set({
            currentDate: dateStr,
            guesses: [],
            gameStatus: 'IN_PROGRESS',
            bonusChanceTaken: false,
            unlockedHint: null,
            startTimeMs: Date.now(),
            endTimeMs: null,
          });
        }
      },
    }),
    {
      name: 'cricksolve-game-storage',
      partialize: (state) => ({
        gameMode: state.gameMode,
        category: state.category,
        currentDate: state.currentDate,
        guesses: state.guesses,
        gameStatus: state.gameStatus,
        streak: state.streak,
        maxStreak: state.maxStreak,
        gamesPlayed: state.gamesPlayed,
        gamesWon: state.gamesWon,
        soundEnabled: state.soundEnabled,
      }),
    }
  )
);
