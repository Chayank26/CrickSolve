import assert from 'node:assert/strict';
import test from 'node:test';
import { createLoader } from './helpers/load-typescript.mjs';

async function setup() {
  let now = 10000;
  const load = createLoader({ globals: { Date: class extends Date { static now() { return now; } } } });
  const manager = load('src/lib/multiplayer-manager.ts');
  const crypto = load('src/lib/server-crypto.ts');
  const storage = load('src/lib/multiplayer-room-store.ts');
  const { PLAYERS } = load('src/data/players.ts');
  const room = await manager.createRoom('host', 'Host');
  const token = (user) => crypto.createMultiplayerMembershipToken(room, user, user === 'host' ? 'host' : 'guest');
  await manager.joinRoom(room.roomCode, 'guest', 'Guest');
  await manager.toggleReadyForUser(room.roomCode, 'guest', room.roundId, token('guest'));
  const status = (value, user = 'host', round = room.roundId) => manager.updateRoomStatusForUser(room.roomCode, user, value, round, token(user));
  const start = async () => { await status('countdown'); now += 3000; await status('in_progress'); };
  const wrong = PLAYERS.filter((player) => player.id !== room.targetPlayerId).map((player) => player.id);
  const guess = (user, attempt, player = wrong[attempt - 1], roundId = room.roundId) => manager.submitRoomGuess({
    roomCode: room.roomCode, userId: user, roundId, membershipToken: token(user), guessedPlayerId: player, attemptNumber: attempt,
  });
  return { load, manager, storage, room, token, start, status, guess, wrong, advance: (ms) => { now += ms; }, current: () => manager.getRoom(room.roomCode) };
}

test('simultaneous same-attempt requests consume exactly one guess', async () => {
  const f = await setup(); await f.start();
  const results = await Promise.allSettled([f.guess('host', 1), f.guess('host', 1)]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal((await f.current()).participants[0].guessesCount, 1);
});

test('simultaneous winning guesses yield exactly one winner', async () => {
  const f = await setup(); await f.start();
  const results = await Promise.allSettled([f.guess('host', 1, f.room.targetPlayerId), f.guess('guest', 1, f.room.targetPlayerId)]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  const room = await f.current();
  assert.equal(room.status, 'finished');
  assert.equal(room.participants.filter((p) => p.isSolved).length, 1);
});

test('seven wrong guesses exhaust one player; both exhausted finishes without a winner', async () => {
  const f = await setup(); await f.start();
  for (let i = 1; i <= 7; i++) await f.guess('host', i);
  assert.equal((await f.current()).status, 'in_progress');
  await assert.rejects(f.guess('host', 8), /no guesses remaining/);
  for (let i = 1; i <= 7; i++) await f.guess('guest', i);
  const room = await f.current();
  assert.equal(room.status, 'finished');
  assert.equal(room.finishReason, 'exhausted');
  assert.equal(room.winnerUserId, undefined);
  assert.equal(room.reveal.id, f.room.targetPlayerId);
});

test('seventh guess can still win and uses room start time', async () => {
  const f = await setup(); await f.start();
  for (let i = 1; i <= 6; i++) await f.guess('host', i);
  f.advance(4200);
  const result = await f.guess('host', 7, f.room.targetPlayerId);
  assert.equal(result.room.winnerUserId, 'host');
  assert.equal(result.solveTimeMs, 4200);
});

test('skipped attempts, duplicate players and invalid IDs cannot consume guesses', async () => {
  const f = await setup(); await f.start();
  await assert.rejects(f.guess('host', 2), /Invalid attempt/);
  await assert.rejects(f.guess('host', 1, 'invalid'), /Invalid player/);
  await f.guess('host', 1);
  await assert.rejects(f.guess('host', 2, f.wrong[0]), /already guessed/);
  assert.equal((await f.current()).participants[0].guessesCount, 1);
});

test('countdown requires both ready, cannot be skipped, and starts at the server deadline', async () => {
  const f = await setup();
  await assert.rejects(f.status('in_progress'), /Countdown has not started/);
  await f.manager.toggleReadyForUser(f.room.roomCode, 'guest', f.room.roundId, f.token('guest'));
  await assert.rejects(f.status('countdown'), /Both players/);
  await f.manager.toggleReadyForUser(f.room.roomCode, 'guest', f.room.roundId, f.token('guest'));
  await f.status('countdown');
  const deadline = (await f.current()).countdownEndsAt;
  await assert.rejects(f.status('in_progress'), /still running/);
  await assert.rejects(f.guess('host', 1), /not active/);
  f.advance(4000);
  await f.status('in_progress');
  assert.equal((await f.current()).startedAt, deadline);
  const revision = (await f.current()).revision;
  f.advance(1000);
  await f.status('in_progress');
  assert.equal((await f.current()).startedAt, deadline);
  assert.equal((await f.current()).revision, revision);
});

test('arbitrary status changes and active-round rematches are rejected', async () => {
  const f = await setup(); await f.start();
  await assert.rejects(f.status('finished'), /Invalid room status/);
  await assert.rejects(f.status('waiting'), /Invalid room status/);
  await assert.rejects(f.manager.rematchRoomForUser(f.room.roomCode, 'host', f.room.roundId, f.token('host')), /Only finished/);
  const guest = await f.status('countdown', 'guest');
  assert.equal(guest.room, null);
});

test('stale guesses and mutations cannot affect a new round', async () => {
  const f = await setup(); await f.start();
  await f.guess('host', 1, f.room.targetPlayerId);
  await f.manager.rematchRoomForUser(f.room.roomCode, 'host', f.room.roundId, f.token('host'));
  await assert.rejects(f.guess('host', 1), /round has ended/);
  await assert.rejects(f.manager.toggleReadyForUser(f.room.roomCode, 'guest', f.room.roundId, f.token('guest')), /round has ended/);
  await assert.rejects(f.manager.rematchRoomForUser(f.room.roomCode, 'host', f.room.roundId, f.token('host')), /round has ended/);
  assert.equal((await f.current()).participants[0].guessesCount, 0);
});

test('membership is checked inside the mutation; private guesses never enter public snapshots', async () => {
  const f = await setup(); await f.start();
  await assert.rejects(f.manager.submitRoomGuess({ roomCode: f.room.roomCode, userId: 'host', roundId: f.room.roundId,
    membershipToken: f.token('guest'), guessedPlayerId: f.wrong[0], attemptNumber: 1 }), /membership/);
  await f.guess('host', 1);
  const publicRoom = f.manager.toPublicRoom(await f.current());
  assert.equal('targetPlayerId' in publicRoom, false);
  assert.equal('guessedPlayerIdsByUser' in publicRoom, false);
});

test('API requires round ID and derives multiplayer timing from the server', async () => {
  const f = await setup(); await f.start(); f.advance(2500);
  const { POST } = f.load('src/app/api/puzzle/guess/route.ts');
  const body = { roomCode: f.room.roomCode, guessedPlayerId: f.room.targetPlayerId, attemptNumber: 1 };
  const request = (data) => new Request('http://localhost/api/puzzle/guess', { method: 'POST', headers: { Authorization: `Bearer ${f.token('host')}` }, body: JSON.stringify(data) });
  assert.equal((await POST(request(body))).status, 400);
  const response = await POST(request({ ...body, roundId: f.room.roundId }));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.solveTimeMs, 2500);
  assert.equal(result.victoryToken, undefined);
  assert.equal(result.room.targetPlayerId, undefined);
});

test('local reads are detached; rejected work cannot mutate stored state', async () => {
  const f = await setup();
  const room = await f.current(); room.participants[0].guessesCount = 99;
  assert.equal((await f.current()).participants[0].guessesCount, 0);
});

test('Redis commit checks lock ownership and rejects a write after the lease expires', async () => {
  const values = new Map();
  let expireBeforeSave = false;
  class FakeRedis {
    async set(key, value, options) {
      if (options?.nx && values.has(key)) return null;
      values.set(key, structuredClone(value)); return 'OK';
    }
    async get(key) { return structuredClone(values.get(key)); }
    async eval(script, keys, args) {
      if (keys.length === 2) {
        if (expireBeforeSave) values.set(keys[0], 'new-owner');
        if (values.get(keys[0]) !== args[0]) return 0;
        values.set(keys[1], JSON.parse(args[1])); return 1;
      }
      if (values.get(keys[0]) === args[0]) { values.delete(keys[0]); return 1; }
      return 0;
    }
  }
  const load = createLoader({ env: { UPSTASH_REDIS_REST_URL: 'https://test.invalid', UPSTASH_REDIS_REST_TOKEN: 'test' }, modules: { '@upstash/redis': { Redis: FakeRedis } } });
  const storage = load('src/lib/multiplayer-room-store.ts');
  const room = { roomCode: 'ABCDEF', revision: 1 };
  await storage.saveStoredRoom(room);
  await storage.withRoomMutation('ABCDEF', (save) => save({ ...room, revision: 2 }));
  assert.equal((await storage.getStoredRoom('ABCDEF')).revision, 2);
  expireBeforeSave = true;
  await assert.rejects(storage.withRoomMutation('ABCDEF', (save) => save({ ...room, revision: 3 })), /ROOM_BUSY/);
  assert.equal((await storage.getStoredRoom('ABCDEF')).revision, 2);
  assert.equal(values.get('cricksolve:multiplayer:room:ABCDEF:lock'), 'new-owner');
});

test('solo game retains its optional eighth attempt', () => {
  const load = createLoader({ modules: { 'zustand/middleware': { persist: (initializer) => initializer } } });
  const { useGameStore: store } = load('src/store/useGameStore.ts');
  const evaluation = { isCorrect: false, guessedPlayer: { id: 'wrong' }, attributeMatches: {}, numericMatches: {} };
  for (let i = 0; i < 7; i++) store.getState().addGuess(evaluation);
  assert.equal(store.getState().activeModal, 'continue');
  store.getState().enableBonusChance();
  store.getState().addGuess(evaluation);
  assert.equal(store.getState().guesses.length, 8);
  assert.equal(store.getState().gameStatus, 'LOST');
});

test('room PATCH rejects invalid status and stale round requests', async () => {
  const f = await setup();
  const { PATCH } = f.load('src/app/api/multiplayer/room/route.ts');
  const request = (extra) => new Request('http://localhost/api/multiplayer/room', { method: 'PATCH', headers: { Authorization: `Bearer ${f.token('host')}` }, body: JSON.stringify({
    roomCode: f.room.roomCode, roundId: f.room.roundId, ...extra,
  }) });
  assert.equal((await PATCH(request({ status: 'finished' }))).status, 400);
  assert.equal((await PATCH(request({ action: 'ready', roundId: '00000000-0000-0000-0000-000000000000' }))).status, 409);
  assert.equal((await PATCH(request({ action: 'ready', status: 'countdown' }))).status, 400);
});
