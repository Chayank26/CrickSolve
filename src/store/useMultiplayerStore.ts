import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/store/useGameStore';
import { MultiplayerReveal, PublicMultiplayerRoom } from '@/types/multiplayer';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AttributeMatchResult, NumericMatchResult } from '@/types/game';

interface MultiplayerState {
  userId: string;
  nickname: string;
  membershipToken: string | null;
  room: PublicMultiplayerRoom | null;
  reveal: MultiplayerReveal | null;
  channel: RealtimeChannel | null;
  isConnecting: boolean;
  error: string | null;
  countdown: number | null;
  isMatchActive: boolean;
  matchWinner: {
    winnerUserId: string;
    winnerNickname: string;
    tries: number;
    solveTimeMs: number;
  } | null;
  initializedRoundId: string | null;
  connectionVersion: number;
  syncTimer: ReturnType<typeof setInterval> | null;
  countdownTimer: ReturnType<typeof setInterval> | null;
  setNickname: (name: string) => void;
  setRoomSnapshot: (room: PublicMultiplayerRoom) => void;
  syncRoomSnapshot: () => Promise<void>;
  startRoomSync: () => void;
  stopRoomSync: () => void;
  createRoom: (hostName?: string) => Promise<boolean>;
  joinRoom: (roomCode: string, guestName?: string) => Promise<boolean>;
  toggleReady: () => Promise<void>;
  startMatchCountdown: () => Promise<void>;
  broadcastGuess: (guessNumber: number, attributes: AttributeMatchResult, numbers: NumericMatchResult, isCorrect: boolean) => void;
  broadcastFinish: (tries: number, solveTimeMs: number, reveal?: MultiplayerReveal) => void;
  requestRematch: () => Promise<void>;
  leaveRoom: () => void;
  cleanupChannel: () => void;
  _subscribeToRoom: (roomCode: string) => void;
  _runCountdown: () => void;
  _connect: (path: string, body: object) => Promise<boolean>;
  _mutateRoom: (body: object, event: string) => Promise<void>;
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
  initializedRoundId: null,
  connectionVersion: 0,
  syncTimer: null,
  countdownTimer: null,

  setNickname: (name) => set({ nickname: name.trim() || 'Cricketer' }),

  setRoomSnapshot: (room) => {
    const state = get();
    const previous = state.room;
    if (!previous || previous.id !== room.id || room.revision < previous.revision) return;
    if (room.roundId !== previous.roundId && room.revision <= previous.revision) return;

    const startsRound = room.status === 'in_progress' && state.initializedRoundId !== room.roundId;
    const finishesRound = room.status === 'finished' &&
      (previous.status !== 'finished' || previous.roundId !== room.roundId);
    const winner = room.participants.find((participant) => participant.userId === room.winnerUserId);
    if (room.status !== 'countdown' && state.countdownTimer) clearInterval(state.countdownTimer);
    set({
      room,
      reveal: room.reveal || null,
      isMatchActive: room.status === 'in_progress',
      matchWinner: room.status === 'finished' && room.winnerUserId ? {
        winnerUserId: room.winnerUserId,
        winnerNickname: room.winnerNickname || winner?.nickname || 'Opponent',
        tries: winner?.guessesCount || 0,
        solveTimeMs: winner?.solveTimeMs ?? Math.max(0, (room.finishedAt || 0) - (room.startedAt || 0)),
      } : null,
      ...(room.status !== 'countdown' ? { countdown: null, countdownTimer: null } : {}),
      ...(startsRound ? { initializedRoundId: room.roundId } : {}),
    });
    if (startsRound) {
      useGameStore.getState().setGameMode('unlimited');
      useGameStore.getState().setActiveModal(null);
    }
    if (finishesRound) useGameStore.getState().setActiveModal('result');
    if (room.status === 'countdown' && !get().countdownTimer) get()._runCountdown();
  },

  syncRoomSnapshot: async () => {
    const { room, userId, membershipToken, connectionVersion } = get();
    if (!room || !membershipToken) return;
    const isCurrent = () => get().connectionVersion === connectionVersion && get().room?.id === room.id;
    try {
      const params = new URLSearchParams({ code: room.roomCode, userId, membershipToken });
      const response = await fetch(`/api/multiplayer/room?${params}`, { cache: 'no-store' });
      const data = await response.json();
      if (!isCurrent()) return;
      if (!response.ok || !data.room) throw new Error(data.error || 'Unable to sync the room');
      get().setRoomSnapshot(data.room);
      // Do not erase an actionable mutation error on every background poll.
      if (get().error?.startsWith('Room sync:')) set({ error: null });
    } catch (error) {
      if (isCurrent()) set({ error: `Room sync: ${error instanceof Error ? error.message : 'Connection interrupted'}. Retrying…` });
    }
  },

  startRoomSync: () => {
    if (get().syncTimer) return;
    void get().syncRoomSnapshot();
    set({ syncTimer: setInterval(() => { void get().syncRoomSnapshot(); }, 1000) });
  },
  stopRoomSync: () => {
    const timer = get().syncTimer;
    if (timer) clearInterval(timer);
    set({ syncTimer: null });
  },

  _connect: async (path, body) => {
    get().leaveRoom();
    const version = get().connectionVersion;
    set({ isConnecting: true, error: null });
    try {
      const response = await fetch(path, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await response.json();
      if (get().connectionVersion !== version) return false;
      if (!response.ok || !data.room || !data.membershipToken) throw new Error(data.error || 'Unable to connect to room');
      set({ room: data.room, membershipToken: data.membershipToken, isConnecting: false });
      get().setRoomSnapshot(data.room);
      get()._subscribeToRoom(data.room.roomCode);
      return true;
    } catch (error) {
      if (get().connectionVersion === version) {
        set({ isConnecting: false, error: error instanceof Error ? error.message : 'Unable to connect to room' });
      }
      return false;
    }
  },
  createRoom: (hostName) => get()._connect('/api/multiplayer/create', {
    hostId: get().userId, hostName: hostName || get().nickname,
  }),
  joinRoom: (roomCode, guestName) => get()._connect('/api/multiplayer/join', {
    roomCode: roomCode.toUpperCase().trim(), userId: get().userId, nickname: guestName || get().nickname,
  }),

  _mutateRoom: async (body, event) => {
    const { room, userId, membershipToken, connectionVersion } = get();
    if (!room || !membershipToken) return;
    const isCurrent = () => get().connectionVersion === connectionVersion &&
      get().room?.id === room.id && get().room?.roundId === room.roundId;
    try {
      const response = await fetch('/api/multiplayer/room', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, roomCode: room.roomCode, roundId: room.roundId, userId, membershipToken }),
      });
      const data = await response.json();
      if (!isCurrent()) return;
      if (!response.ok || !data.room) throw new Error(data.error || 'Unable to update room');
      get().setRoomSnapshot(data.room);
      set({ error: null });
      void get().channel?.send({ type: 'broadcast', event, payload: {
        roomCode: data.room.roomCode, roundId: data.room.roundId, revision: data.room.revision,
      } });
    } catch (error) {
      if (isCurrent()) set({ error: error instanceof Error ? error.message : 'Unable to update room. Please retry.' });
    }
  },
  toggleReady: () => get()._mutateRoom({ action: 'ready' }, 'ROOM_UPDATED'),
  startMatchCountdown: () => get()._mutateRoom({ status: 'countdown' }, 'MATCH_COUNTDOWN'),
  requestRematch: () => get()._mutateRoom({ action: 'rematch' }, 'REMATCH'),

  // Broadcasts only notify peers to fetch state; they never decide local outcomes.
  broadcastGuess: (guessNumber, attributeMatches, numericMatches, isCorrect) => {
    const { room, channel, userId } = get();
    if (!room) return;
    void channel?.send({ type: 'broadcast', event: 'OPPONENT_GUESS', payload: {
      roomCode: room.roomCode, roundId: room.roundId, revision: room.revision,
      userId, guessNumber, attributeMatches, numericMatches, isCorrect,
    } });
  },
  broadcastFinish: () => {
    const { room, channel } = get();
    if (!room) return;
    void channel?.send({ type: 'broadcast', event: 'MATCH_FINISH', payload: {
      roomCode: room.roomCode, roundId: room.roundId, revision: room.revision,
    } });
  },

  leaveRoom: () => {
    const timer = get().countdownTimer;
    if (timer) clearInterval(timer);
    get().stopRoomSync();
    get().cleanupChannel();
    set({
      connectionVersion: get().connectionVersion + 1,
      room: null, reveal: null, membershipToken: null, countdown: null, countdownTimer: null,
      initializedRoundId: null, isMatchActive: false, matchWinner: null, error: null, isConnecting: false,
    });
  },
  cleanupChannel: () => {
    const channel = get().channel;
    if (channel) void supabase.removeChannel(channel);
    set({ channel: null });
  },

  _runCountdown: () => {
    const { room, connectionVersion } = get();
    if (!room || room.status !== 'countdown' || !room.countdownEndsAt) return;
    const remaining = () => Math.max(0, Math.ceil((room.countdownEndsAt! - Date.now()) / 1000));
    set({ countdown: remaining() });
    const interval = setInterval(() => {
      const state = get();
      if (state.connectionVersion !== connectionVersion || state.room?.roundId !== room.roundId || state.room.status !== 'countdown') {
        clearInterval(interval);
        return;
      }
      const seconds = remaining();
      set({ countdown: seconds });
      if (seconds > 0) return;
      clearInterval(interval);
      // Guests wait for the host's server-accepted transition. No optimistic start.
      if (room.hostId !== state.userId) return;
      void get()._mutateRoom({ status: 'in_progress' }, 'ROOM_UPDATED').then(() => {
        if (get().connectionVersion === connectionVersion && get().room?.roundId === room.roundId && get().room?.status === 'countdown') {
          // Allow the next reconciliation to retry a failed start request.
          set({ countdownTimer: null });
        }
      });
    }, 1000);
    set({ countdownTimer: interval });
  },
  _subscribeToRoom: (roomCode) => {
    get().cleanupChannel();
    const channel = supabase.channel(`cricksolve_room_${roomCode.toLowerCase()}`, {
      config: { broadcast: { self: false } },
    });
    for (const event of ['MATCH_COUNTDOWN', 'OPPONENT_GUESS', 'ROOM_UPDATED', 'MATCH_FINISH', 'REMATCH']) {
      channel.on('broadcast', { event }, () => { void get().syncRoomSnapshot(); });
    }
    channel.subscribe();
    set({ channel });
    get().startRoomSync();
  },
}));
