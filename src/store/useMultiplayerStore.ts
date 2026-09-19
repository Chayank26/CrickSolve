import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import {
  MultiplayerRoom,
  RealtimeCountdownPayload,
  RealtimeMatchFinishPayload,
  RealtimeOpponentGuessPayload,
  RealtimeRematchPayload,
  RoomParticipant,
  RoomStatus,
} from '@/types/multiplayer';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AttributeMatchResult, NumericMatchResult } from '@/types/game';

interface MultiplayerState {
  // Session & Identity
  userId: string;
  nickname: string;
  membershipToken: string | null;

  // Active Room State
  room: MultiplayerRoom | null;
  channel: RealtimeChannel | null;
  isConnecting: boolean;
  error: string | null;

  // Match State
  countdown: number | null;
  isMatchActive: boolean;
  matchWinner: {
    winnerUserId: string;
    winnerNickname: string;
    tries: number;
    solveTimeMs: number;
  } | null;

  // Actions
  setNickname: (name: string) => void;
  createRoom: (hostName?: string) => Promise<boolean>;
  joinRoom: (roomCode: string, guestName?: string) => Promise<boolean>;
  toggleReady: () => void;
  startMatchCountdown: () => void;
  broadcastGuess: (
    guessNumber: number,
    attributeMatches: AttributeMatchResult,
    numericMatches: NumericMatchResult,
    isCorrect: boolean
  ) => void;
  broadcastFinish: (tries: number, solveTimeMs: number) => void;
  requestRematch: () => Promise<void>;
  leaveRoom: () => void;
  cleanupChannel: () => void;
  _subscribeToRoom: (roomCode: string) => void;
  _runCountdown: (seconds: number) => void;
}

function getOrGenerateUserId(): string {
  if (typeof window === 'undefined') return 'user_server';
  try {
    let stored = localStorage.getItem('cricksolve_mp_uid');
    if (!stored) {
      stored = `user_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
      localStorage.setItem('cricksolve_mp_uid', stored);
    }
    return stored;
  } catch {
    return `user_${Date.now()}`;
  }
}

export const useMultiplayerStore = create<MultiplayerState>()((set, get) => ({
  userId: getOrGenerateUserId(),
  nickname: 'Cricketer',
  membershipToken: null,
  room: null,
  channel: null,
  isConnecting: false,
  error: null,
  countdown: null,
  isMatchActive: false,
  matchWinner: null,

  setNickname: (name) => {
    const clean = name.trim() || 'Cricketer';
    set({ nickname: clean });
  },

  createRoom: async (hostName) => {
    const { userId, nickname } = get();
    const activeName = hostName || nickname;
    set({ isConnecting: true, error: null });

    try {
      const res = await fetch('/api/multiplayer/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId: userId, hostName: activeName }),
      });

      const data = await res.json();
      if (!res.ok || !data.room) {
        set({ isConnecting: false, error: data.error || 'Failed to create room' });
        return false;
      }

      set({ room: data.room, membershipToken: data.membershipToken || null, isConnecting: false });
      get()._subscribeToRoom(data.room.roomCode);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error creating room';
      set({ isConnecting: false, error: msg });
      return false;
    }
  },

  joinRoom: async (roomCode, guestName) => {
    const { userId, nickname } = get();
    const activeName = guestName || nickname;
    const cleanCode = roomCode.toUpperCase().trim();
    set({ isConnecting: true, error: null });

    try {
      const res = await fetch('/api/multiplayer/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: cleanCode, userId, nickname: activeName }),
      });

      const data = await res.json();
      if (!res.ok || !data.room) {
        set({ isConnecting: false, error: data.error || 'Failed to join room' });
        return false;
      }

      set({ room: data.room, membershipToken: data.membershipToken || null, isConnecting: false });
      get()._subscribeToRoom(cleanCode);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error joining room';
      set({ isConnecting: false, error: msg });
      return false;
    }
  },

  toggleReady: () => {
    const { room, userId, channel } = get();
    if (!room) return;

    const updatedParticipants = room.participants.map((p) =>
      p.userId === userId ? { ...p, isReady: !p.isReady } : p
    );

    const updatedRoom: MultiplayerRoom = {
      ...room,
      participants: updatedParticipants,
    };

    set({ room: updatedRoom });

    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'PARTICIPANT_UPDATE',
        payload: { participants: updatedParticipants },
      });
    }
  },

  startMatchCountdown: () => {
    const { room, channel, userId, membershipToken } = get();
    if (!room) return;

    void fetch('/api/multiplayer/room', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCode: room.roomCode,
        userId,
        membershipToken,
        status: 'countdown',
      }),
    });

    const countdownPayload: RealtimeCountdownPayload = {
      countdownSeconds: 3,
      targetStartTimeMs: Date.now() + 3000,
    };

    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'MATCH_COUNTDOWN',
        payload: countdownPayload,
      });
    }

    // Trigger local countdown
    get()._runCountdown(3);
  },

  broadcastGuess: (guessNumber, attributeMatches, numericMatches, isCorrect) => {
    const { userId, room, channel } = get();
    if (!room) return;

    const payload: RealtimeOpponentGuessPayload = {
      userId,
      guessNumber,
      attributeMatches,
      numericMatches,
      isCorrect,
    };

    // Update local state
    const updatedParticipants = room.participants.map((p) =>
      p.userId === userId
        ? {
            ...p,
            guessesCount: guessNumber,
            isSolved: isCorrect,
            recentGuessMatches: { attributeMatches, numericMatches },
          }
        : p
    );

    set({ room: { ...room, participants: updatedParticipants } });

    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'OPPONENT_GUESS',
        payload,
      });
    }
  },

  broadcastFinish: (tries, solveTimeMs) => {
    const { userId, nickname, room, channel } = get();
    if (!room) return;

    const payload: RealtimeMatchFinishPayload = {
      winnerUserId: userId,
      winnerNickname: nickname,
      tries,
      solveTimeMs,
      targetPlayerId: room.targetPlayerId,
    };

    set({
      matchWinner: payload,
      isMatchActive: false,
      room: {
        ...room,
        status: 'finished',
        winnerUserId: userId,
        winnerNickname: nickname,
      },
    });

    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'MATCH_FINISH',
        payload,
      });
    }
  },

  requestRematch: async () => {
    const { room, channel, userId, membershipToken } = get();
    if (!room) return;

    try {
      const res = await fetch('/api/multiplayer/room', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: room.roomCode,
          userId,
          membershipToken,
          action: 'rematch',
        }),
      });

      const data = await res.json();
      if (data.room) {
        set({
          room: data.room,
          countdown: null,
          isMatchActive: false,
          matchWinner: null,
        });

        if (channel) {
          channel.send({
            type: 'broadcast',
            event: 'REMATCH',
            payload: {
              newTargetPlayerId: data.room.targetPlayerId,
              timestamp: Date.now(),
            } as RealtimeRematchPayload,
          });
        }
      }
    } catch (err) {
      console.error('Failed to request rematch:', err);
    }
  },

  leaveRoom: () => {
    get().cleanupChannel();
    set({
      room: null,
      channel: null,
      membershipToken: null,
      countdown: null,
      isMatchActive: false,
      matchWinner: null,
      error: null,
    });
  },

  cleanupChannel: () => {
    const { channel } = get();
    if (channel) {
      supabase.removeChannel(channel);
      set({ channel: null });
    }
  },

  // Internal Helpers
  _runCountdown: (seconds: number) => {
    set({ countdown: seconds });
    const interval = setInterval(() => {
      const current = get().countdown;
      if (current === null || current <= 1) {
        clearInterval(interval);
        set({ countdown: null, isMatchActive: true });
        const { room } = get();
        if (room) {
          set({ room: { ...room, status: 'in_progress' } });
          const { userId, membershipToken } = get();
          void fetch('/api/multiplayer/room', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomCode: room.roomCode,
              userId,
              membershipToken,
              status: 'in_progress',
            }),
          });
        }
      } else {
        set({ countdown: current - 1 });
      }
    }, 1000);
  },

  _subscribeToRoom: (roomCode: string) => {
    get().cleanupChannel();

    const channelName = `cricksolve_room_${roomCode.toLowerCase()}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'MATCH_COUNTDOWN' }, ({ payload }: { payload: RealtimeCountdownPayload }) => {
        get()._runCountdown(payload.countdownSeconds || 3);
      })
      .on('broadcast', { event: 'OPPONENT_GUESS' }, ({ payload }: { payload: RealtimeOpponentGuessPayload }) => {
        const { room } = get();
        if (!room) return;

        const updatedParticipants = room.participants.map((p) =>
          p.userId === payload.userId
            ? {
                ...p,
                guessesCount: payload.guessNumber,
                isSolved: payload.isCorrect,
                recentGuessMatches: {
                  attributeMatches: payload.attributeMatches,
                  numericMatches: payload.numericMatches,
                },
              }
            : p
        );

        set({ room: { ...room, participants: updatedParticipants } });
      })
      .on('broadcast', { event: 'PARTICIPANT_UPDATE' }, ({ payload }: { payload: { participants: RoomParticipant[] } }) => {
        const { room } = get();
        if (room) {
          set({ room: { ...room, participants: payload.participants } });
        }
      })
      .on('broadcast', { event: 'MATCH_FINISH' }, ({ payload }: { payload: RealtimeMatchFinishPayload }) => {
        const { room } = get();
        set({
          matchWinner: payload,
          isMatchActive: false,
          room: room
            ? {
                ...room,
                status: 'finished',
                winnerUserId: payload.winnerUserId,
                winnerNickname: payload.winnerNickname,
              }
            : null,
        });
      })
      .on('broadcast', { event: 'REMATCH' }, ({ payload }: { payload: RealtimeRematchPayload }) => {
        const { room } = get();
        if (room) {
          const resetParticipants = room.participants.map((p) => ({
            ...p,
            isReady: p.role === 'host',
            guessesCount: 0,
            isSolved: false,
            solveTimeMs: undefined,
            recentGuessMatches: undefined,
          }));

          set({
            room: {
              ...room,
              status: 'waiting',
              targetPlayerId: payload.newTargetPlayerId,
              participants: resetParticipants,
              winnerUserId: undefined,
              winnerNickname: undefined,
            },
            countdown: null,
            isMatchActive: false,
            matchWinner: null,
          });
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Connected to room ${roomCode}`);
        }
      });

    set({ channel });
  },
}));
