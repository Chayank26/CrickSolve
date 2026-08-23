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

  // Player Profile & Standing
  nickname: string;
  lastSolvedDate: string | null;
  hasSeenHowTo: boolean;
  userRank: number | null;

  // Sound & Preferences
  soundEnabled: boolean;

  // User Stats & Streaks
  streak: number;
  maxStreak: number;
  gamesPlayed: number;
  gamesWon: number;

  // Modals
  activeModal: 'howTo' | 'stats' | 'calendar' | 'share' | 'result' | 'leaderboard' | 'hintPicker' | null;

  // Actions
  setGameMode: (mode: GameMode) => void;
  setCategory: (category: PlayerCategory) => void;
  addGuess: (evaluation: GuessEvaluation) => void;
  setNickname: (name: string) => void;
  setUserRank: (rank: number | null) => void;
  enableBonusChance: () => void;
  revealAttributeHint: (attrLabel: string, attrValue: string) => void;
  toggleSound: () => void;
  setActiveModal: (modal: 'howTo' | 'stats' | 'calendar' | 'share' | 'result' | 'leaderboard' | 'hintPicker' | null) => void;
  closeHowTo: () => void;
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

      nickname: 'Cricketer',
      lastSolvedDate: null,
      hasSeenHowTo: false,
      userRank: null,

      soundEnabled: true,

      streak: 0,
      maxStreak: 0,
      gamesPlayed: 0,
      gamesWon: 0,

      // Default activeModal is 'howTo' on first land
      activeModal: 'howTo',

      setGameMode: (mode) => {
        set({ gameMode: mode, guesses: [], gameStatus: 'IN_PROGRESS', unlockedHint: null, startTimeMs: null, endTimeMs: null });
      },

      setCategory: (category) => {
        set({ category, guesses: [], gameStatus: 'IN_PROGRESS', unlockedHint: null, startTimeMs: null, endTimeMs: null });
      },

      setNickname: (nickname) => {
        set({ nickname: nickname.trim() || 'Cricketer' });
      },

      setUserRank: (rank) => {
        set({ userRank: rank });
      },

      closeHowTo: () => {
        set({ hasSeenHowTo: true, activeModal: null });
      },

      addGuess: (evaluation) => {
        const { guesses, gameStatus, streak, maxStreak, gamesPlayed, gamesWon, startTimeMs, lastSolvedDate, currentDate } = get();
        if (gameStatus !== 'IN_PROGRESS') return;

        const now = Date.now();
        const start = startTimeMs || now;

        const updatedGuesses = [...guesses, evaluation];

        let newStatus: GameStatus = 'IN_PROGRESS';
        let newStreak = streak;
        let newMaxStreak = maxStreak;
        let newGamesPlayed = gamesPlayed;
        let newGamesWon = gamesWon;
        let newLastSolvedDate = lastSolvedDate;

        if (evaluation.isCorrect) {
          newStatus = 'WON';
          newGamesPlayed = gamesPlayed + 1;
          newGamesWon = gamesWon + 1;

          // Streak Logic
          const todayStr = currentDate || new Date().toISOString().split('T')[0];
          const y = new Date();
          y.setDate(y.getDate() - 1);
          const yesterdayStr = y.toISOString().split('T')[0];

          if (lastSolvedDate === yesterdayStr) {
            newStreak = streak + 1;
          } else if (lastSolvedDate === todayStr) {
            newStreak = streak;
          } else {
            newStreak = 1;
          }

          newMaxStreak = Math.max(newStreak, maxStreak);
          newLastSolvedDate = todayStr;
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
          lastSolvedDate: newLastSolvedDate,
          activeModal: newStatus !== 'IN_PROGRESS' ? 'result' : get().activeModal,
        });
      },

      enableBonusChance: () => {
        set({ bonusChanceTaken: true, gameStatus: 'IN_PROGRESS' });
      },

      revealAttributeHint: (attrLabel, attrValue) => {
        set({
          unlockedHint: `${attrLabel}: ${attrValue}`,
          activeModal: null,
        });
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
          startTimeMs: null,
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
            startTimeMs: null,
            endTimeMs: null,
            userRank: null,
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
        nickname: state.nickname,
        lastSolvedDate: state.lastSolvedDate,
        userRank: state.userRank,
        hasSeenHowTo: state.hasSeenHowTo,
        soundEnabled: state.soundEnabled,
      }),
    }
  )
);
