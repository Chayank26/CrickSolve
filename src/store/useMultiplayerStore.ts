import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import {
  MultiplayerRoom,
  MultiplayerReveal,
  PublicMultiplayerRoom,
  RealtimeCountdownPayload,
  RealtimeMatchFinishPayload,
  RealtimeOpponentGuessPayload,
  RealtimeRematchPayload,
  RealtimeRoomUpdatePayload,
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
  room: PublicMultiplayerRoom | null;
  reveal: MultiplayerReveal | null;
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
  syncTimer: ReturnType<typeof setInterval> | null;

  // Actions
  setNickname: (name: string) => void;
  setReveal: (reveal: MultiplayerReveal | null) => void;
  setRoomSnapshot: (room: PublicMultiplayerRoom) => void;
  syncRoomSnapshot: () => Promise<void>;
  startRoomSync: () => void;
  stopRoomSync: () => void;
  createRoom: (hostName?: string) => Promise<boolean>;
  joinRoom: (roomCode: string, guestName?: string) => Promise<boolean>;
  toggleReady: () => void;
  startMatchCountdown: () => Promise<void>;
  broadcastGuess: (
    guessNumber: number,
    attributeMatches: AttributeMatchResult,
    numericMatches: NumericMatchResult,
    isCorrect: boolean
  ) => void;
  broadcastFinish: (tries: number, solveTimeMs: number, reveal?: MultiplayerReveal) => void;
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
  reveal: null,
  channel: null,
  isConnecting: false,
  error: null,
  countdown: null,
  isMatchActive: false,
  matchWinner: null,
  syncTimer: null,

  setNickname: (name) => {
    const clean = name.trim() || 'Cricketer';
    set({ nickname: clean });
  },

  setReveal: (reveal) => set({ reveal }),
  setRoomSnapshot: (room) => set((state) => ({
    room,
    reveal: room.reveal || (room.status === 'waiting' ? null : state.reveal),
  })),

  syncRoomSnapshot: async () => {
    const { room, userId, membershipToken } = get();
    if (!room || !membershipToken) return;

    try {
      const params = new URLSearchParams({
        code: room.roomCode,
        userId,
        membershipToken,
      });
      const response = await fetch(`/api/multiplayer/room?${params.toString()}`);
      const data = await response.json();
      if (!response.ok || !data.room) return;

      const serverRoom = data.room as PublicMultiplayerRoom;
      const currentRoom = get().room;
      if (!currentRoom || serverRoom.roomCode !== currentRoom.roomCode || serverRoom.roundId !== currentRoom.roundId) {
        set({ room: serverRoom, reveal: serverRoom.reveal || null });
      } else if (serverRoom.revision >= currentRoom.revision) {
        set({
          room: serverRoom,
          reveal: serverRoom.reveal || (serverRoom.status === 'waiting' ? null : get().reveal),
        });
      }

      const activeRoom = get().room;
      if (activeRoom?.status === 'countdown' && activeRoom.countdownEndsAt && get().countdown === null) {
        const remainingSeconds = Math.max(1, Math.ceil((activeRoom.countdownEndsAt - Date.now()) / 1000));
        get()._runCountdown(remainingSeconds);
      }
    } catch {
      // Realtime remains available while a transient reconciliation request fails.
    }
  },

  startRoomSync: () => {
    if (get().syncTimer) return;
    void get().syncRoomSnapshot();
    const syncTimer = setInterval(() => {
      void get().syncRoomSnapshot();
    }, 1000);
    set({ syncTimer });
  },

  stopRoomSync: () => {
    const { syncTimer } = get();
    if (syncTimer) clearInterval(syncTimer);
    set({ syncTimer: null });
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

  toggleReady: async () => {
    const { room, userId, membershipToken, channel } = get();
    if (!room) return;

    const response = await fetch('/api/multiplayer/room', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCode: room.roomCode,
        userId,
        membershipToken,
        action: 'ready',
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.room) {
      set({ error: data.error || 'Unable to update readiness' });
      return;
    }

    set({ room: data.room, error: null });
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'ROOM_UPDATED',
        payload: {
          roomCode: data.room.roomCode,
          roundId: data.room.roundId,
          revision: data.room.revision,
          room: data.room,
        } satisfies RealtimeRoomUpdatePayload,
      });
    }
  },

  startMatchCountdown: async () => {
    const { room, channel, userId, membershipToken } = get();
    if (!room) return;

    const response = await fetch('/api/multiplayer/room', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCode: room.roomCode,
        userId,
        membershipToken,
        status: 'countdown',
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.room) {
      set({ error: data.error || 'Unable to start the match' });
      return;
    }
    set({ room: data.room, error: null });

    const countdownPayload: RealtimeCountdownPayload = {
      roomCode: data.room.roomCode,
      roundId: data.room.roundId,
      revision: data.room.revision,
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
      roomCode: room.roomCode,
      roundId: room.roundId,
      revision: room.revision,
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

  broadcastFinish: (tries, solveTimeMs, reveal) => {
    const { userId, nickname, room, channel } = get();
    if (!room) return;

    const payload: RealtimeMatchFinishPayload = {
      roomCode: room.roomCode,
      roundId: room.roundId,
      revision: room.revision,
      winnerUserId: userId,
      winnerNickname: nickname,
      tries,
      solveTimeMs,
      reveal,
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
          reveal: null,
        });

        if (channel) {
          channel.send({
            type: 'broadcast',
            event: 'REMATCH',
            payload: {
              roomCode: data.room.roomCode,
              roundId: data.room.roundId,
              revision: data.room.revision,
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
    get().stopRoomSync();
    get().cleanupChannel();
    set({
      room: null,
      reveal: null,
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
      .on('broadcast', { event: 'MATCH_COUNTDOWN' }, () => {
        void get().syncRoomSnapshot();
      })
      .on('broadcast', { event: 'OPPONENT_GUESS' }, () => {
        void get().syncRoomSnapshot();
      })
      .on('broadcast', { event: 'ROOM_UPDATED' }, () => {
        void get().syncRoomSnapshot();
      })
      .on('broadcast', { event: 'MATCH_FINISH' }, () => {
        void get().syncRoomSnapshot();
      })
      .on('broadcast', { event: 'REMATCH' }, () => {
        void get().syncRoomSnapshot();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Connected to room ${roomCode}`);
        }
      });

    set({ channel });
    get().startRoomSync();
  },
}));
