import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import { createLoader } from './helpers/load-typescript.mjs';
const loadTypes = createLoader();

// Exercise the real store with deterministic transport, clock and solo-store boundaries.
const require = createRequire(import.meta.url);
const source = ts.transpileModule(readFileSync(new URL('../src/store/useMultiplayerStore.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
function setup() {
  const timers = new Map();
  let nextTimer = 0;
  let resets = 0;
  let modal = null;
  let fetchImpl = async () => { throw new Error('offline'); };
  const exports = {};
  const channel = { on() { return this; }, subscribe() {}, send() {} };
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name === '@/types/multiplayer') return loadTypes('src/types/multiplayer.ts');
      if (name === '@/lib/supabase') return { supabase: { channel: () => channel, removeChannel() {} } };
      if (name === '@/store/useGameStore') return { useGameStore: { getState: () => ({
        setGameMode() { resets++; }, setActiveModal(value) { modal = value; },
      }) } };
      return require(name);
    },
    URLSearchParams, Date, console,
    fetch: (...args) => fetchImpl(...args),
    setInterval(callback) { timers.set(++nextTimer, callback); return nextTimer; },
    clearInterval(id) { timers.delete(id); },
  });
  const store = exports.useMultiplayerStore;
  const room = {
    id: 'room_AAAAAA_1', roomCode: 'AAAAAA', hostId: 'host', hostName: 'Host',
    status: 'waiting', roundId: 'round1', revision: 1, createdAt: 1,
    participants: [
      { userId: 'host', nickname: 'Host', role: 'host', guessesCount: 0, isReady: true, isSolved: false, connectedAt: 1 },
      { userId: 'guest', nickname: 'Guest', role: 'guest', guessesCount: 0, isReady: true, isSolved: false, connectedAt: 1 },
    ],
  };
  store.setState({ room, membershipToken: 'token', userId: 'guest' });
  return { store, room, timers, resets: () => resets, modal: () => modal, dismiss: () => { modal = null; }, fetch: (fn) => { fetchImpl = fn; } };
}
const response = (room) => ({ ok: true, json: async () => ({ room }) });

test('repeated active snapshots preserve multiplayer guesses without resetting solo gameplay', () => {
  const f = setup();
  const active = { ...f.room, status: 'in_progress', revision: 3 };
  f.store.getState().setRoomSnapshot(active);
  f.store.getState().addGuess({ guessedPlayer: { id: 'first' } }, active.roundId, 1);
  f.store.getState().setRoomSnapshot({ ...active });
  f.store.getState().setRoomSnapshot({ ...active, revision: 4 });
  assert.equal(f.store.getState().guesses.length, 1);
  assert.equal(f.resets(), 0);
  assert.equal(f.store.getState().isMatchActive, true);
});

test('opponent finish opens results from server state without broadcast; polling does not reopen dismissed results', () => {
  const f = setup();
  const finished = { ...f.room, status: 'finished', revision: 5, winnerUserId: 'host', winnerNickname: 'Host',
    startedAt: 1000, finishedAt: 8000, reveal: { id: 'player', name: 'Mystery' } };
  f.store.getState().setRoomSnapshot(finished);
  assert.equal(f.modal(), 'result');
  assert.equal(f.store.getState().matchWinner.winnerUserId, 'host');
  assert.equal(f.store.getState().matchWinner.solveTimeMs, 7000);
  assert.equal(f.store.getState().isMatchActive, false);
  assert.equal(f.store.getState().reveal.name, 'Mystery');
  f.dismiss();
  f.store.getState().setRoomSnapshot({ ...finished });
  assert.equal(f.modal(), null);
  assert.equal(f.resets(), 0);
});

test('old snapshots cannot rewind revisions or resurrect a prior round', () => {
  const f = setup();
  f.store.getState().setRoomSnapshot({ ...f.room, roundId: 'round2', revision: 8 });
  f.store.getState().setRoomSnapshot({ ...f.room, status: 'in_progress', revision: 7 });
  assert.equal(f.store.getState().room.roundId, 'round2');
  assert.equal(f.resets(), 0);
  f.store.getState().setRoomSnapshot({ ...f.room, roundId: 'round2', revision: 9, status: 'in_progress' });
  assert.equal(f.resets(), 0);
});

test('a pending room fetch cannot restore a room after leaving', async () => {
  const f = setup();
  let resolve;
  f.fetch(() => new Promise((done) => { resolve = done; }));
  const sync = f.store.getState().syncRoomSnapshot();
  f.store.getState().leaveRoom();
  resolve(response({ ...f.room, revision: 2 }));
  await sync;
  assert.equal(f.store.getState().room, null);
});

test('old connection responses cannot overwrite a new connection even to the same room', async () => {
  const f = setup();
  let resolve;
  f.fetch(() => new Promise((done) => { resolve = done; }));
  const sync = f.store.getState().syncRoomSnapshot();
  f.store.getState().leaveRoom();
  f.store.setState({ room: f.room, membershipToken: 'new-token' });
  resolve(response({ ...f.room, revision: 100, status: 'finished' }));
  await sync;
  assert.equal(f.store.getState().room.status, 'waiting');
});

test('leaving during countdown cancels timers and cannot activate gameplay', () => {
  const f = setup();
  f.store.getState().setRoomSnapshot({ ...f.room, status: 'countdown', revision: 2, countdownEndsAt: Date.now() + 3000 });
  assert.equal(f.timers.size, 1);
  f.store.getState().leaveRoom();
  assert.equal(f.timers.size, 0);
  assert.equal(f.store.getState().isMatchActive, false);
});

test('guest countdown expiry waits for server state and never sends a host mutation', () => {
  const f = setup();
  f.fetch(() => assert.fail('guest must not patch room status'));
  f.store.getState().setRoomSnapshot({ ...f.room, status: 'countdown', revision: 2, countdownEndsAt: Date.now() - 1 });
  for (const tick of [...f.timers.values()]) tick();
  assert.equal(f.store.getState().isMatchActive, false);
  assert.equal(f.store.getState().room.status, 'countdown');
});

test('mutation failures are shown and do not optimistically change readiness', async () => {
  const f = setup();
  f.fetch(async () => ({ ok: false, json: async () => ({ error: 'Room busy' }) }));
  await f.store.getState().toggleReady();
  assert.equal(f.store.getState().error, 'Room busy');
  assert.equal(f.store.getState().room.revision, 1);
});

test('finish broadcast cannot declare a local winner', () => {
  const f = setup();
  f.store.getState().broadcastFinish(1, 1000);
  assert.equal(f.store.getState().matchWinner, null);
  assert.equal(f.store.getState().room.status, 'waiting');
});

test('host countdown waits for an accepted response before activating gameplay', async () => {
  const f = setup();
  f.store.setState({ userId: 'host' });
  let resolve;
  f.fetch(() => new Promise((done) => { resolve = done; }));
  f.store.getState().setRoomSnapshot({ ...f.room, status: 'countdown', revision: 2, countdownEndsAt: Date.now() - 1 });
  for (const tick of [...f.timers.values()]) tick();
  assert.equal(f.store.getState().isMatchActive, false);
  resolve(response({ ...f.room, revision: 3, status: 'in_progress' }));
  await new Promise((done) => setImmediate(done));
  assert.equal(f.store.getState().isMatchActive, true);
  assert.equal(f.resets(), 0);
});

test('late readiness mutation cannot replace a new round', async () => {
  const f = setup();
  let resolve;
  f.fetch(() => new Promise((done) => { resolve = done; }));
  const mutation = f.store.getState().toggleReady();
  f.store.getState().setRoomSnapshot({ ...f.room, roundId: 'round2', revision: 8 });
  resolve(response({ ...f.room, revision: 2 }));
  await mutation;
  assert.equal(f.store.getState().room.roundId, 'round2');
});

test('a pending join cannot reconnect after the user leaves', async () => {
  const f = setup();
  let resolve;
  f.fetch(() => new Promise((done) => { resolve = done; }));
  const join = f.store.getState().joinRoom('AAAAAA');
  f.store.getState().leaveRoom();
  resolve({ ok: true, json: async () => ({ room: f.room, membershipToken: 'token' }) });
  assert.equal(await join, false);
  assert.equal(f.store.getState().room, null);
  assert.equal(f.timers.size, 0);
});

test('room sync sends credentials only in the authorization header', async () => {
  const f = setup();
  f.fetch(async (url, options) => {
    assert.equal(url.includes('membershipToken'), false);
    assert.equal(url.includes('userId'), false);
    assert.equal(options.headers.Authorization, 'Bearer token');
    return response(f.room);
  });
  await f.store.getState().syncRoomSnapshot();
});

test('client adopts the server-issued identity and does not send its previous ID on creation', async () => {
  const f = setup();
  f.fetch(async (url, options) => {
    if (options.method === 'POST') {
      assert.equal(JSON.parse(options.body).hostId, undefined);
      return { ok: true, json: async () => ({ room: f.room, userId: 'server-issued', membershipToken: 'new-token' }) };
    }
    return response(f.room);
  });
  assert.equal(await f.store.getState().createRoom('Name'), true);
  assert.equal(f.store.getState().userId, 'server-issued');
  f.store.getState().leaveRoom();
});

test('repeated untrusted sync triggers cannot create concurrent room requests', async () => {
  const f = setup();
  let calls = 0;
  let resolve;
  f.fetch(() => { calls++; return new Promise((done) => { resolve = done; }); });
  const pending = f.store.getState().syncRoomSnapshot();
  await Promise.all(Array.from({ length: 20 }, () => f.store.getState().syncRoomSnapshot()));
  assert.equal(calls, 1);
  resolve(response(f.room));
  await pending;
  await f.store.getState().syncRoomSnapshot();
  assert.equal(calls, 1);
});

test('public broadcasts contain no membership token or guess data', () => {
  const f = setup();
  let payload;
  f.store.setState({ channel: { send(message) { payload = message.payload; } } });
  f.store.getState().broadcastGuess(1, { country: true }, { tests: 'match' }, true);
  assert.equal(payload.membershipToken, undefined);
  assert.equal(payload.userId, undefined);
  assert.equal(payload.attributeMatches, undefined);
  assert.equal(payload.isCorrect, undefined);
  assert.equal(payload.roundId, f.room.roundId);
});
