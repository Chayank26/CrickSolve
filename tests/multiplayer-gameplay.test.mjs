import assert from 'node:assert/strict';
import test from 'node:test';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createLoader } from './helpers/load-typescript.mjs';

async function serverGame() {
  let now = 10000;
  const load = createLoader({ globals: { Date: class extends Date { static now() { return now; } } } });
  const manager = load('src/lib/multiplayer-manager.ts');
  const crypto = load('src/lib/server-crypto.ts');
  const { PLAYERS } = load('src/data/players.ts');
  const room = await manager.createRoom('host', 'Host');
  const token = (id) => crypto.createMultiplayerMembershipToken(room, id, id === 'host' ? 'host' : 'guest');
  await manager.joinRoom(room.roomCode, 'guest', 'Guest');
  await manager.toggleReadyForUser(room.roomCode, 'guest', room.roundId, token('guest'));
  await manager.updateRoomStatusForUser(room.roomCode, 'host', 'countdown', room.roundId, token('host'));
  now += 3000;
  await manager.updateRoomStatusForUser(room.roomCode, 'host', 'in_progress', room.roundId, token('host'));
  const target = PLAYERS.find((player) => player.id === room.targetPlayerId);
  const wrong = PLAYERS.filter((player) => player.country !== target.country && player.battingHand !== target.battingHand);
  assert.ok(wrong.length >= 7);
  const guess = (attempt, user = 'host', id = wrong[attempt - 1].id) => manager.submitRoomGuess({
    roomCode: room.roomCode, roundId: room.roundId, userId: user, membershipToken: token(user), guessedPlayerId: id, attemptNumber: attempt,
  });
  const hint = (key = 'country', user = 'host', round = room.roundId) => manager.claimRoomHint(room.roomCode, user, round, token(user), key);
  const four = async (user = 'host') => { for (let i = 1; i <= 4; i++) await guess(i, user); };
  return { load, manager, room, token, target, wrong, guess, hint, four };
}

test('bonus unlocks after exactly four accepted guesses, revealing only the chosen attribute', async () => {
  const f = await serverGame();
  for (let i = 1; i <= 3; i++) await f.guess(i);
  await assert.rejects(f.hint(), /after four guesses/);
  const fourth = await f.guess(4);
  assert.equal(fourth.evaluation.unlockedHint, undefined);
  const result = await f.hint();
  assert.equal(result.room.participants[0].guessesCount, 4);
  const member = f.manager.toMemberRoomResponse(result.room, 'host');
  assert.equal(member.hint.key, 'country');
  assert.equal(member.hint.value, f.target.country);
  assert.equal('targetPlayerId' in member.room, false);
  assert.equal('hintsByUser' in member.room, false);
  assert.equal(f.manager.toMemberRoomResponse(result.room, 'guest').hint, null);
});

test('hint claims are private through authenticated GET/PATCH and validate attribute keys', async () => {
  const f = await serverGame(); await f.four();
  const { GET, PATCH } = f.load('src/app/api/multiplayer/room/route.ts');
  const request = (attribute, user = 'host') => new Request('http://localhost/api/multiplayer/room', { method: 'PATCH',
    headers: { Authorization: `Bearer ${f.token(user)}` }, body: JSON.stringify({ roomCode: f.room.roomCode, roundId: f.room.roundId, action: 'hint', attribute }) });
  for (const key of ['birthYear', 'constructor', { country: true }]) assert.equal((await PATCH(request(key))).status, 400);
  const accepted = await PATCH(request('country'));
  assert.equal(accepted.status, 200);
  assert.equal((await accepted.json()).hint.value, f.target.country);
  const opponent = await GET(new Request(`http://localhost/api/multiplayer/room?code=${f.room.roomCode}`, { headers: { Authorization: `Bearer ${f.token('guest')}` } }));
  const data = await opponent.json();
  assert.equal(data.hint, null);
  assert.equal(data.room.hintsByUser, undefined);
  const own = await GET(new Request(`http://localhost/api/multiplayer/room?code=${f.room.roomCode}`, { headers: { Authorization: `Bearer ${f.token('host')}` } }));
  assert.equal((await own.json()).hint.value, f.target.country);
});

test('concurrent different hints consume one bonus; retrying the same hint is idempotent', async () => {
  const f = await serverGame(); await f.four();
  const results = await Promise.allSettled([f.hint('country'), f.hint('battingHand')]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  const room = await f.manager.getRoom(f.room.roomCode);
  const key = room.hintsByUser.host.key;
  const retry = await f.hint(key);
  assert.equal(retry.room.revision, room.revision);
  assert.equal(retry.room.participants[0].guessesCount, 4);
});

test('each player independently earns one hint and an already matched attribute is not charged', async () => {
  const f = await serverGame(); await f.four(); await f.four('guest');
  await f.hint('country', 'host');
  await f.hint('battingHand', 'guest');
  const room = await f.manager.getRoom(f.room.roomCode);
  assert.equal(f.manager.toMemberRoomResponse(room, 'host').hint.key, 'country');
  assert.equal(f.manager.toMemberRoomResponse(room, 'guest').hint.key, 'battingHand');

  const g = await serverGame(); await g.four();
  const current = await g.manager.getRoom(g.room.roomCode);
  const ids = current.guessedPlayerIdsByUser.host;
  const { evaluatePlayerGuess } = g.load('src/lib/game-engine.ts');
  const matchedKey = Object.keys(evaluatePlayerGuess(ids[0], g.room.targetPlayerId, 1).attributeMatches).find((key) => evaluatePlayerGuess(ids[0], g.room.targetPlayerId, 1).attributeMatches[key]);
  if (matchedKey) {
    await assert.rejects(g.hint(matchedKey), /already unlocked/);
    assert.equal((await g.manager.getRoom(g.room.roomCode)).hintsByUser, undefined);
  } else {
    // Guarantee a matched card by choosing a fifth guess with the target's country.
    const { PLAYERS } = g.load('src/data/players.ts');
    const sameCountry = PLAYERS.find((p) => p.id !== g.target.id && p.country === g.target.country);
    assert.ok(sameCountry);
    await g.guess(5, 'host', sameCountry.id);
    await assert.rejects(g.hint('country'), /already unlocked/);
  }
});

test('exhausted, finished and stale rounds cannot claim hints; rematch clears bonuses', async () => {
  const f = await serverGame();
  for (let i = 1; i <= 7; i++) await f.guess(i);
  await assert.rejects(f.hint(), /only available/);
  await f.guess(1, 'guest', f.target.id);
  await assert.rejects(f.hint(), /only available/);
  await f.manager.rematchRoomForUser(f.room.roomCode, 'host', f.room.roundId, f.token('host'));
  await f.manager.rematchRoomForUser(f.room.roomCode, 'guest', f.room.roundId, f.token('guest'), 'accept', (await f.manager.getRoom(f.room.roomCode)).rematchRequest.id);
  await assert.rejects(f.hint(), /round has ended/);
  const next = await f.manager.getRoom(f.room.roomCode);
  assert.equal(Object.keys(next.hintsByUser).length, 0);
});

function clientGame() {
  const saved = new Map();
  const storage = { getItem: (key) => saved.get(key) || null, setItem: (key, value) => saved.set(key, value), removeItem: (key) => saved.delete(key) };
  let fetchImpl = async () => { throw new Error('offline'); };
  const load = createLoader({
    globals: { setInterval: () => 1, clearInterval() {}, fetch: (...args) => fetchImpl(...args) },
    modules: {
      'zustand/middleware': { persist: (initializer, options) => persist(initializer, { ...options, storage: createJSONStorage(() => storage) }) },
      '@/lib/supabase': { supabase: { removeChannel() {} } },
    },
  });
  const solo = load('src/store/useGameStore.ts').useGameStore;
  const mp = load('src/store/useMultiplayerStore.ts').useMultiplayerStore;
  const active = load('src/hooks/useActiveGame.ts').selectActiveGame;
  const room = { id: 'room-1', roomCode: 'ABCDEF', hostId: 'host', hostName: 'Host', roundId: 'round-1', revision: 1, status: 'waiting', createdAt: 1,
    participants: [{ userId: 'host', nickname: 'Host', role: 'host', isReady: true, guessesCount: 0, isSolved: false, connectedAt: 1 }] };
  mp.setState({ room, membershipToken: 'token', userId: 'host' });
  mp.getState().setRoomSnapshot(room);
  return { solo, mp, room, view: () => active(solo.getState(), mp.getState()), saved, fetch: (fn) => { fetchImpl = fn; } };
}
const evaluation = { isCorrect: false, guessedPlayer: { id: 'wrong' }, attributeMatches: { country: false }, numericMatches: {} };

test('duel state never replaces persisted solo progress and leaving restores the same board', () => {
  const f = clientGame();
  f.solo.setState({ guesses: [evaluation], currentDate: '2026-09-20', unlockedHint: 'solo hint', manuallyUnlockedAttributes: { role: 'Batter' },
    startTimeMs: 10, sessionToken: 'solo-session', streak: 5, gamesPlayed: 9 });
  const persisted = f.saved.get('cricksolve-game-storage');
  assert.equal(f.view().gameMode, 'multiplayer');
  f.mp.getState().setRoomSnapshot({ ...f.room, status: 'in_progress', startedAt: 1000, revision: 2 });
  f.mp.getState().addGuess(evaluation, f.room.roundId, 1);
  f.mp.getState().setRoomSnapshot({ ...f.room, status: 'finished', startedAt: 1000, finishedAt: 2500, winnerUserId: 'guest', revision: 3 });
  assert.equal(f.view().gameStatus, 'LOST');
  assert.equal(f.view().endTimeMs, 2500);
  assert.equal(f.saved.get('cricksolve-game-storage'), persisted);
  f.mp.getState().leaveRoom();
  assert.equal(f.view().gameMode, 'daily');
  assert.equal(f.view().sessionToken, 'solo-session');
  assert.equal(f.view().guesses.length, 1);
  assert.equal(f.view().unlockedHint, 'solo hint');
  assert.equal(f.solo.getState().streak, 5);
  assert.equal(f.saved.get('cricksolve-game-storage'), persisted);
});

test('multiplayer cap, per-round reset and hint projection use only multiplayer state', () => {
  const f = clientGame();
  f.mp.getState().setRoomSnapshot({ ...f.room, status: 'in_progress', revision: 2 });
  for (let i = 1; i <= 8; i++) f.mp.getState().addGuess(evaluation, f.room.roundId, i);
  assert.equal(f.mp.getState().guesses.length, 7);
  assert.equal(f.solo.getState().guesses.length, 0);
  f.mp.getState().setRoomSnapshot({ ...f.room, status: 'in_progress', revision: 3 }, { key: 'country', value: 'India' });
  assert.equal(f.view().manuallyUnlockedAttributes.country, 'India');
  assert.equal(f.view().unlockedHint, 'COUNTRY: India');
  f.mp.getState().setRoomSnapshot({ ...f.room, roundId: 'round-2', revision: 4 });
  assert.equal(f.mp.getState().guesses.length, 0);
  assert.equal(f.mp.getState().hint, null);
  assert.equal(f.view().bonusChanceTaken, false);
  f.mp.getState().addGuess(evaluation, 'round-1', 1);
  assert.equal(f.mp.getState().guesses.length, 0);
});

test('failed hint requests stay selectable and delayed responses cannot cross rounds', async () => {
  const f = clientGame();
  const ready = { ...f.room, status: 'in_progress', revision: 2, participants: [{ ...f.room.participants[0], guessesCount: 4 }] };
  f.mp.getState().setRoomSnapshot(ready);
  f.mp.getState().startHintSelection();
  f.fetch(async () => ({ ok: false, json: async () => ({ error: 'Room busy' }) }));
  assert.equal(await f.mp.getState().claimHint('country'), false);
  assert.equal(f.mp.getState().hint, null);
  assert.equal(f.mp.getState().isHintSelecting, true);
  assert.equal(f.mp.getState().isClaimingHint, false);
  let resolve;
  f.fetch(() => new Promise((done) => { resolve = done; }));
  const pending = f.mp.getState().claimHint('country');
  f.mp.getState().setRoomSnapshot({ ...f.room, roundId: 'round-2', revision: 4 });
  resolve({ ok: true, json: async () => ({ room: { ...ready, revision: 3 }, hint: { key: 'country', value: 'India' } }) });
  assert.equal(await pending, false);
  assert.equal(f.mp.getState().hint, null);
});

test('private hint received through reconciliation survives repeat snapshots without resetting guesses', () => {
  const f = clientGame();
  const room = { ...f.room, status: 'in_progress', revision: 5, participants: [{ ...f.room.participants[0], guessesCount: 4 }] };
  f.mp.getState().setRoomSnapshot(room);
  f.mp.getState().addGuess(evaluation, room.roundId, 1);
  f.mp.getState().startHintSelection();
  f.mp.getState().setRoomSnapshot({ ...room, revision: 6 }, { key: 'country', value: 'India' });
  assert.equal(f.mp.getState().isHintSelecting, false);
  f.mp.getState().setRoomSnapshot({ ...room, revision: 5 }, null);
  assert.equal(f.mp.getState().hint.value, 'India');
  assert.equal(f.mp.getState().guesses.length, 1);
});

test('selecting a bonus card completes the client-to-route hint flow without touching solo state', async () => {
  const server = await serverGame(); await server.four();
  const f = clientGame();
  const room = server.manager.toPublicRoom(await server.manager.getRoom(server.room.roomCode));
  f.mp.setState({ room, userId: 'host', membershipToken: server.token('host') });
  f.mp.getState().setRoomSnapshot(room, null);
  const saved = f.saved.get('cricksolve-game-storage');
  const { PATCH } = server.load('src/app/api/multiplayer/room/route.ts');
  f.fetch((url, options) => PATCH(new Request(`http://localhost${url}`, options)));
  f.mp.getState().startHintSelection();
  assert.equal(await f.mp.getState().claimHint('country'), true);
  assert.equal(f.view().manuallyUnlockedAttributes.country, server.target.country);
  assert.equal(f.mp.getState().isHintSelecting, false);
  assert.equal(f.mp.getState().room.participants[0].guessesCount, 4);
  assert.equal(f.saved.get('cricksolve-game-storage'), saved);
});

test('a winning guess that commits first prevents a concurrent hint from revealing more data', async () => {
  const f = await serverGame(); await f.four();
  const results = await Promise.allSettled([f.guess(5, 'host', f.target.id), f.hint()]);
  assert.equal(results[0].status, 'fulfilled');
  assert.equal(results[1].status, 'rejected');
  assert.equal((await f.manager.getRoom(f.room.roomCode)).hintsByUser, undefined);
});
