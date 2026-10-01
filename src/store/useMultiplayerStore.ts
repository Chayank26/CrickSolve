import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/store/useGameStore';
import { MultiplayerHint, MultiplayerHintKey, MULTIPLAYER_HINT_AFTER, MULTIPLAYER_MAX_GUESSES, MultiplayerReveal, PublicMultiplayerRoom } from '@/types/multiplayer';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AttributeMatchResult, GuessEvaluation, NumericMatchResult } from '@/types/game';

const SESSION_KEY = 'cricksolve.multiplayer.session.v1';
interface SavedSession { roomCode: string; roomId: string; userId: string; membershipToken: string; }
function saveSession(session: SavedSession | null) {
  try {
    if (session) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch { /* Private browsing/storage restrictions must not prevent playing. */ }
}
function readSession(): SavedSession | null {
  try {
    const value = JSON.parse(window.sessionStorage.getItem(SESSION_KEY) || 'null');
    if (value && /^[A-Z2-9]{6}$/.test(value.roomCode) &&
        ['roomId', 'userId', 'membershipToken'].every((key) => typeof value[key] === 'string' && value[key].length > 0)) return value;
    saveSession(null);
  } catch { saveSession(null); }
  return null;
}
function roomFetch(url: string, options: RequestInit) {
  return fetch(url, { ...options, ...(typeof AbortSignal !== 'undefined' ? { signal: AbortSignal.timeout(10000) } : {}) });
}
const expiredSession = (status: number) => [401, 403, 404, 410].includes(status);

interface MultiplayerState {
  isReconnecting: boolean;
  recoveryPending: boolean;
  restoreSession: () => Promise<void>;
  guesses: GuessEvaluation[];
  hint: MultiplayerHint | null;
  isHintSelecting: boolean;
  isClaimingHint: boolean;
  addGuess: (evaluation: GuessEvaluation, roundId: string, attemptNumber: number) => void;
  startHintSelection: () => void;
  cancelHintSelection: () => void;
  claimHint: (key: MultiplayerHintKey) => Promise<boolean>;
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
  syncInFlight: boolean;
  lastSyncAt: number;
  syncTimer: ReturnType<typeof setInterval> | null;
  countdownTimer: ReturnType<typeof setInterval> | null;
  setNickname: (name: string) => void;
  setRoomSnapshot: (room: PublicMultiplayerRoom, hint?: MultiplayerHint | null, guesses?: GuessEvaluation[]) => void;
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
  _connect: (path: string, body: object, membershipToken?: string) => Promise<boolean>;
  _mutateRoom: (body: object, event: string) => Promise<void>;
}

export const useMultiplayerStore = create<MultiplayerState>()((set, get) => ({
  isReconnecting: false, recoveryPending: false,
  guesses: [], hint: null, isHintSelecting: false, isClaimingHint: false,
  userId: 'user_anon',
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
  syncInFlight: false,
  lastSyncAt: 0,
  syncTimer: null,
  countdownTimer: null,

  setNickname: (name) => set({ nickname: name.trim() || 'Cricketer' }),

  addGuess: (evaluation, roundId, attemptNumber) => {
    const state = get();
    if (!state.room || state.room.roundId !== roundId || state.guesses.length >= MULTIPLAYER_MAX_GUESSES ||
        attemptNumber !== state.guesses.length + 1) return;
    set({ guesses: [...state.guesses, evaluation] });
  },
  startHintSelection: () => {
    const state = get();
    const count = state.room?.participants.find((player) => player.userId === state.userId)?.guessesCount || 0;
    if (!state.isReconnecting && state.room?.status === 'in_progress' && count >= MULTIPLAYER_HINT_AFTER && count < MULTIPLAYER_MAX_GUESSES && !state.hint) {
      set({ isHintSelecting: true });
    }
  },
  cancelHintSelection: () => set({ isHintSelecting: false }),
  claimHint: async (key) => {
    const state = get();
    if (!state.room || !state.isHintSelecting || state.isClaimingHint) return false;
    set({ isClaimingHint: true });
    await get()._mutateRoom({ action: 'hint', attribute: key }, 'ROOM_UPDATED');
    if (get().connectionVersion !== state.connectionVersion || get().room?.roundId !== state.room.roundId) return false;
    set({ isClaimingHint: false });
    return get().hint?.key === key;
  },

  setRoomSnapshot: (room, hint, guesses) => {
    const state = get();
    const previous = state.room;
    if (!previous || previous.id !== room.id || room.revision < previous.revision) return;
    if (room.roundId !== previous.roundId && room.revision <= previous.revision) return;

    const newRound = state.initializedRoundId !== room.roundId;
    const startsRound = room.status === 'in_progress' && (newRound || previous.status !== 'in_progress');
    const finishesRound = room.status === 'finished' &&
      (newRound || previous.status !== 'finished' || previous.roundId !== room.roundId);
    const winner = room.participants.find((participant) => participant.userId === room.winnerUserId);
    if (room.status !== 'countdown' && state.countdownTimer) clearInterval(state.countdownTimer);
    set({
      room,
      ...(newRound ? { guesses: [], hint: null, isHintSelecting: false, isClaimingHint: false, initializedRoundId: room.roundId } : {}),
      ...(hint !== undefined ? { hint } : {}),
      ...(guesses !== undefined ? { guesses } : {}),
      ...(hint || room.status !== 'in_progress' || (room.participants.find((p) => p.userId === state.userId)?.guessesCount || 0) >= MULTIPLAYER_MAX_GUESSES ? { isHintSelecting: false } : {}),
      reveal: room.reveal || null,
      isMatchActive: room.status === 'in_progress',
      matchWinner: room.status === 'finished' && room.winnerUserId ? {
        winnerUserId: room.winnerUserId,
        winnerNickname: room.winnerNickname || winner?.nickname || 'Opponent',
        tries: winner?.guessesCount || 0,
        solveTimeMs: winner?.solveTimeMs ?? Math.max(0, (room.finishedAt || 0) - (room.startedAt || 0)),
      } : null,
      ...(room.status !== 'countdown' ? { countdown: null, countdownTimer: null } : {}),
    });
    if (startsRound) {
      useGameStore.getState().setActiveModal(null);
    }
    if (finishesRound) useGameStore.getState().setActiveModal('result');
    if (room.status === 'countdown' && !get().countdownTimer) get()._runCountdown();
  },

  syncRoomSnapshot: async () => {
    const { room, membershipToken, connectionVersion } = get();
    if (!room || !membershipToken) return;
    if (get().syncInFlight || Date.now() - get().lastSyncAt < 500) return;
    set({ syncInFlight: true, lastSyncAt: Date.now() });
    const isCurrent = () => get().connectionVersion === connectionVersion && get().room?.id === room.id;
    try {
      const params = new URLSearchParams({ code: room.roomCode });
      const response = await roomFetch(`/api/multiplayer/room?${params}`, { cache: 'no-store', headers: { Authorization: `Bearer ${membershipToken}` } });
      const data = await response.json();
      if (!isCurrent()) return;
      if (expiredSession(response.status)) {
        get().leaveRoom();
        set({ error: data.error || 'Your multiplayer session has expired. Join a new room.' });
        return;
      }
      if (!response.ok || !data.room) throw new Error(data.error || 'Unable to sync the room');
      set({ isReconnecting: false });
      get().setRoomSnapshot(data.room, data.hint, data.guesses);
      // Do not erase an actionable mutation error on every background poll.
      if (get().error?.startsWith('Room sync:')) set({ error: null });
    } catch (error) {
      if (isCurrent()) set({ isReconnecting: true, error: `Room sync: ${error instanceof Error ? error.message : 'Connection interrupted'}. Retrying…` });
    } finally {
      if (isCurrent()) set({ syncInFlight: false });
    }
  },

  restoreSession: async () => {
    if (get().room || get().isConnecting) return;
    const session = readSession();
    if (!session) return;
    const version = get().connectionVersion;
    set({ isConnecting: true, recoveryPending: true, isReconnecting: true, error: null });
    try {
      const response = await roomFetch(`/api/multiplayer/room?${new URLSearchParams({ code: session.roomCode })}`, {
        cache: 'no-store', headers: { Authorization: `Bearer ${session.membershipToken}` },
      });
      const data = await response.json();
      if (get().connectionVersion !== version) return;
      if (expiredSession(response.status)) {
        get().leaveRoom();
        set({ error: data.error || 'Your multiplayer session has expired. Join a new room.' });
        return;
      }
      if (!response.ok || !data.room) throw new Error(data.error || 'Unable to restore your duel');
      if (data.room.id !== session.roomId || !data.room.participants.some((p: { userId: string }) => p.userId === session.userId)) {
        get().leaveRoom();
        set({ error: 'Your saved room membership is no longer available.' });
        return;
      }
      set({ userId: session.userId, membershipToken: session.membershipToken, room: data.room,
        nickname: data.room.participants.find((p: { userId: string }) => p.userId === session.userId).nickname,
        isConnecting: false, recoveryPending: false, isReconnecting: false, error: null });
      get().setRoomSnapshot(data.room, data.hint, data.guesses);
      if (data.room.status === 'waiting') useGameStore.getState().setActiveModal('multiplayer');
      get()._subscribeToRoom(data.room.roomCode);
    } catch (error) {
      if (get().connectionVersion === version) {
        set({ isConnecting: false, error: `Room sync: ${error instanceof Error ? error.message : 'Connection interrupted'}. Retrying…` });
        get().startRoomSync();
      }
    }
  },

  startRoomSync: () => {
    if (get().syncTimer) return;
    void get().syncRoomSnapshot();
    set({ syncTimer: setInterval(() => {
      if (get().room) void get().syncRoomSnapshot();
      else if (get().recoveryPending) void get().restoreSession();
    }, 1000) });
  },
  stopRoomSync: () => {
    const timer = get().syncTimer;
    if (timer) clearInterval(timer);
    set({ syncTimer: null });
  },

  _connect: async (path, body, membershipToken) => {
    get().leaveRoom();
    useGameStore.getState().setActiveModal('multiplayer');
    const version = get().connectionVersion;
    set({ isConnecting: true, error: null });
    try {
      const response = await roomFetch(path, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(membershipToken ? { Authorization: `Bearer ${membershipToken}` } : {}) }, body: JSON.stringify(body),
      });
      const data = await response.json();
      if (get().connectionVersion !== version) return false;
      if (!response.ok || !data.room || !data.membershipToken || !data.userId) throw new Error(data.error || 'Unable to connect to room');
      set({ userId: data.userId, room: data.room, membershipToken: data.membershipToken, isConnecting: false });
      get().setRoomSnapshot(data.room, data.hint, data.guesses);
      saveSession({ roomCode: data.room.roomCode, roomId: data.room.id, userId: data.userId, membershipToken: data.membershipToken });
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
    hostName: hostName || get().nickname,
  }),
  joinRoom: (roomCode, guestName) => get()._connect('/api/multiplayer/join', {
    roomCode: roomCode.toUpperCase().trim(), nickname: guestName || get().nickname,
  }, get().room?.roomCode === roomCode.toUpperCase().trim() ? get().membershipToken || undefined : undefined),

  _mutateRoom: async (body, event) => {
    const { room, membershipToken, connectionVersion } = get();
    if (!room || !membershipToken) return;
    const isCurrent = () => get().connectionVersion === connectionVersion &&
      get().room?.id === room.id && get().room?.roundId === room.roundId;
    try {
      const response = await roomFetch('/api/multiplayer/room', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${membershipToken}` },
        body: JSON.stringify({ ...body, roomCode: room.roomCode, roundId: room.roundId }),
      });
      const data = await response.json();
      if (!isCurrent()) return;
      if (!response.ok || !data.room) throw new Error(data.error || 'Unable to update room');
      get().setRoomSnapshot(data.room, data.hint, data.guesses);
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
  broadcastGuess: () => {
    const { room, channel } = get();
    if (!room) return;
    void channel?.send({ type: 'broadcast', event: 'OPPONENT_GUESS', payload: {
      roomCode: room.roomCode, roundId: room.roundId, revision: room.revision,
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
    saveSession(null);
    if (get().room) useGameStore.getState().setActiveModal(null);
    const timer = get().countdownTimer;
    if (timer) clearInterval(timer);
    get().stopRoomSync();
    get().cleanupChannel();
    set({
      connectionVersion: get().connectionVersion + 1, syncInFlight: false, lastSyncAt: 0,
      guesses: [], hint: null, isHintSelecting: false, isClaimingHint: false,
      userId: 'user_anon', room: null, reveal: null, membershipToken: null, countdown: null, countdownTimer: null,
      isReconnecting: false, recoveryPending: false,
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
