import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { createLoader } from './helpers/load-typescript.mjs';

function setup(options) {
  const load = createLoader(options);
  const create = load('src/app/api/multiplayer/create/route.ts').POST;
  const join = load('src/app/api/multiplayer/join/route.ts').POST;
  const { GET, PATCH } = load('src/app/api/multiplayer/room/route.ts');
  const guess = load('src/app/api/puzzle/guess/route.ts').POST;
  const post = (body, token, headers = {}) => new Request('http://localhost/api', {
    method: 'POST', headers: { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body),
  });
  const host = async () => {
    const response = await create(post({ hostName: 'Host' }));
    assert.equal(response.status, 200);
    return response.json();
  };
  const guest = async (h) => {
    const response = await join(post({ roomCode: h.room.roomCode, nickname: 'Guest' }));
    assert.equal(response.status, 200);
    return response.json();
  };
  const get = (h, token = h.membershipToken) => GET(new Request(`http://localhost/api?code=${h.room.roomCode}`, {
    headers: { Authorization: `Bearer ${token}` },
  }));
  return { load, create, join, GET, PATCH, guess, post, host, guest, get };
}

test('create/join issue distinct server-owned identities and reject supplied identities or roles', async () => {
  const f = setup();
  assert.equal((await f.create(f.post({ hostId: 'victim', hostName: 'Host' }))).status, 400);
  const h = await f.host(); const g = await f.guest(h);
  assert.notEqual(h.userId, g.userId);
  assert.equal(h.room.hostId, h.userId);
  assert.equal((await f.join(f.post({ roomCode: h.room.roomCode, userId: h.userId, nickname: 'Attacker' }))).status, 400);
  assert.equal((await f.join(f.post({ roomCode: h.room.roomCode, role: 'host' }))).status, 400);
  const room = (await (await f.get(h)).json()).room;
  assert.equal(room.hostName, 'Host');
  assert.equal(room.participants.length, 2);
});

test('public IDs cannot reclaim a participant even when bypassing the route helper', async () => {
  const f = setup(); const h = await f.host(); const g = await f.guest(h);
  const manager = f.load('src/lib/multiplayer-manager.ts');
  await assert.rejects(manager.joinRoom(h.room.roomCode, h.userId, 'Attacker'), /membership/);
  await assert.rejects(manager.joinRoom(h.room.roomCode, h.userId, 'Attacker', g.membershipToken), /membership/);
  assert.equal((await f.join(f.post({ roomCode: h.room.roomCode, nickname: 'Attacker' }))).status, 409);
});

test('valid credential reclaims its own slot and retains its role', async () => {
  const f = setup(); const h = await f.host();
  const response = await f.join(f.post({ roomCode: h.room.roomCode, nickname: 'Renamed' }, h.membershipToken));
  assert.equal(response.status, 200);
  const joined = await response.json();
  assert.equal(joined.userId, h.userId);
  assert.equal(joined.room.participants.length, 1);
  assert.equal(joined.room.hostName, 'Renamed');
  const crypto = f.load('src/lib/server-crypto.ts');
  assert.equal(crypto.verifyMultiplayerMembershipToken(joined.membershipToken, h.room.roomCode).role, 'host');
});

test('guest cannot change host status, mutate host readiness, or submit as host', async () => {
  const f = setup(); const h = await f.host(); const g = await f.guest(h);
  const base = { roomCode: h.room.roomCode, roundId: h.room.roundId };
  assert.equal((await f.PATCH(f.post({ ...base, status: 'countdown' }, g.membershipToken))).status, 403);
  assert.equal((await f.PATCH(f.post({ ...base, action: 'ready', userId: h.userId }, g.membershipToken))).status, 400);
  assert.equal((await f.guess(f.post({ ...base, guessedPlayerId: 'fake', attemptNumber: 1, userId: h.userId }, g.membershipToken))).status, 400);
  assert.equal((await f.PATCH(f.post({ ...base, action: 'ready' }, g.membershipToken))).status, 200);
  const room = (await (await f.get(h)).json()).room;
  assert.equal(room.participants[0].isReady, true);
  assert.equal(room.participants[1].isReady, true);
});

test('membership token must match the stored role and participant even on reads', async () => {
  const f = setup(); const h = await f.host(); const g = await f.guest(h);
  const crypto = f.load('src/lib/server-crypto.ts');
  const roleMismatch = crypto.createMultiplayerMembershipToken(h.room, g.userId, 'host');
  assert.equal((await f.get(h, roleMismatch)).status, 403);
  const absentMember = crypto.createMultiplayerMembershipToken(h.room, 'absent', 'guest');
  assert.equal((await f.get(h, absentMember)).status, 403);
});

test('room-instance binding rejects old credentials when a room code is reused', async () => {
  const f = setup(); const h = await f.host();
  const storage = f.load('src/lib/multiplayer-room-store.ts');
  const room = await storage.getStoredRoom(h.room.roomCode);
  await storage.saveStoredRoom({ ...room, id: 'replacement-room' });
  assert.equal((await f.get(h)).status, 401);
  assert.equal((await f.join(f.post({ roomCode: h.room.roomCode }, h.membershipToken))).status, 401);
});

test('tokens require a purpose, expiry, valid role and signature; solo tokens cannot authorize rooms', async () => {
  const f = setup(); const h = await f.host();
  const crypto = f.load('src/lib/server-crypto.ts');
  const payload = JSON.parse(Buffer.from(h.membershipToken.split('.')[0], 'base64url'));
  const sign = (value) => {
    const encoded = Buffer.from(JSON.stringify(value)).toString('base64url');
    return `${encoded}.${createHmac('sha256', 'unit-test-secret').update(encoded).digest('base64url')}`;
  };
  for (const token of [sign({ ...payload, expiresAt: undefined }), sign({ ...payload, expiresAt: '9999999999999' }),
    sign({ ...payload, expiresAt: 1 }), sign({ ...payload, role: 'admin' }), sign({ ...payload, purpose: undefined }),
    `${h.membershipToken}tampered`, crypto.createSessionToken('2026-09-27', 'International')]) {
    assert.equal((await f.get(h, token)).status, 401);
  }
});

test('URL credentials are rejected; membership responses cannot be cached', async () => {
  const f = setup(); const h = await f.host();
  const urlResponse = await f.GET(new Request(`http://localhost/api?code=${h.room.roomCode}&userId=${h.userId}&membershipToken=${h.membershipToken}`));
  assert.equal(urlResponse.status, 401);
  const response = await f.get(h);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await response.json()).membershipToken, undefined);
});

test('malformed fields and oversized JSON are rejected with client errors', async () => {
  const f = setup();
  for (const body of [null, [], { hostName: '' }, { hostName: 'x'.repeat(21) }, { hostName: { name: 'object' } }, { hostName: 'bad\nname' }]) {
    assert.equal((await f.create(f.post(body))).status, 400);
  }
  assert.equal((await f.create(new Request('http://localhost', { method: 'POST', body: '{' }))).status, 400);
  assert.equal((await f.create(f.post({ hostName: 'x'.repeat(5000) }))).status, 413);
  assert.equal((await f.join(f.post({ roomCode: '../bad' }))).status, 400);
});

test('creation throttles requests and ignores untrusted forwarded addresses', async () => {
  const f = setup();
  for (let i = 0; i < 10; i++) assert.equal((await f.create(f.post({}, undefined, { 'x-forwarded-for': `fake-${i}` }))).status, 200);
  const response = await f.create(f.post({}, undefined, { 'x-forwarded-for': 'another-address' }));
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get('retry-after')) > 0);
});

test('member read limits allow polling but reject excess traffic', async () => {
  const f = setup(); const h = await f.host();
  for (let i = 0; i < 180; i++) assert.equal((await f.get(h)).status, 200);
  assert.equal((await f.get(h)).status, 429);
});

test('local rate limit resets after the window and Redis errors fail closed', async () => {
  let now = 1000;
  const load = createLoader({ globals: { Date: class extends Date { static now() { return now; } } } });
  const { enforceRateLimit } = load('src/lib/multiplayer-rate-limit.ts');
  await enforceRateLimit('test', 'user', 1);
  await assert.rejects(enforceRateLimit('test', 'user', 1), (error) => error.status === 429);
  now += 60000;
  await enforceRateLimit('test', 'user', 1);
  const unavailable = createLoader({ env: { UPSTASH_REDIS_REST_URL: 'https://test.invalid', UPSTASH_REDIS_REST_TOKEN: 'test' },
    modules: { '@upstash/redis': { Redis: class { async eval() { throw new Error('secret backend details'); } } } } });
  await assert.rejects(unavailable('src/lib/multiplayer-rate-limit.ts').enforceRateLimit('test', 'user', 1), (error) => error.status === 503 && !error.message.includes('secret'));
});

test('fresh participants can ready, start, and submit a real winning guess using header credentials', async () => {
  let now = 10000;
  const f = setup({ globals: { Date: class extends Date { static now() { return now; } } } });
  const h = await f.host(); const g = await f.guest(h);
  const base = { roomCode: h.room.roomCode, roundId: h.room.roundId };
  assert.equal((await f.PATCH(f.post({ ...base, action: 'ready' }, g.membershipToken))).status, 200);
  assert.equal((await f.PATCH(f.post({ ...base, status: 'countdown' }, h.membershipToken))).status, 200);
  now += 3000;
  assert.equal((await f.PATCH(f.post({ ...base, status: 'in_progress' }, h.membershipToken))).status, 200);
  const privateRoom = await f.load('src/lib/multiplayer-manager.ts').getRoom(h.room.roomCode);
  const result = await f.guess(f.post({ ...base, guessedPlayerId: privateRoom.targetPlayerId, attemptNumber: 1 }, g.membershipToken));
  assert.equal(result.status, 200);
  assert.equal((await result.json()).room.winnerUserId, g.userId);
  assert.equal((await (await f.get(h)).json()).room.status, 'finished');
});

test('Redis limiter shares counters across instances and hashes subjects', async () => {
  const counts = new Map();
  class FakeRedis {
    async eval(script, keys, args) {
      assert.ok(script.includes("redis.call('INCR'"));
      assert.ok(script.includes("redis.call('EXPIRE'"));
      assert.equal(args[0], 60);
      assert.equal(keys[0].includes('raw-client-address'), false);
      const count = (counts.get(keys[0]) || 0) + 1;
      counts.set(keys[0], count);
      return [count, 60];
    }
  }
  const options = { env: { UPSTASH_REDIS_REST_URL: 'https://test.invalid', UPSTASH_REDIS_REST_TOKEN: 'test' }, modules: { '@upstash/redis': { Redis: FakeRedis } } };
  const a = createLoader(options)('src/lib/multiplayer-rate-limit.ts');
  const b = createLoader(options)('src/lib/multiplayer-rate-limit.ts');
  const results = await Promise.allSettled(Array.from({ length: 6 }, (_, i) => (i % 2 ? a : b).enforceRateLimit('test', 'raw-client-address', 5)));
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 5);
  const failure = results.find((result) => result.status === 'rejected');
  assert.equal(failure.reason.status, 429);
});

test('solo guess route still returns its normal evaluation and session token', async () => {
  const f = setup();
  const { PLAYERS } = f.load('src/data/players.ts');
  const result = await f.guess(f.post({ mode: 'unlimited', guessedPlayerId: PLAYERS[0].id, targetPlayerId: PLAYERS[0].id, attemptNumber: 1, sessionToken: null }));
  assert.equal(result.status, 200);
  const body = await result.json();
  assert.equal(body.evaluation.isCorrect, true);
  assert.ok(body.sessionToken);
  assert.ok(body.victoryToken);
});

test('rematch HTTP actions require valid intent, request ID and the other member consent', async () => {
  const f = setup(); const h = await f.host(); const g = await f.guest(h);
  const storage = f.load('src/lib/multiplayer-room-store.ts');
  const room = await storage.getStoredRoom(h.room.roomCode);
  room.status = 'finished'; room.finishReason = 'exhausted';
  await storage.saveStoredRoom(room);
  const patch = (extra, token = h.membershipToken) => f.PATCH(f.post({ roomCode: room.roomCode, roundId: room.roundId, action: 'rematch', ...extra }, token));
  assert.equal((await patch({ rematchAction: 'invalid' })).status, 400);
  assert.equal((await patch({ rematchAction: 'accept' })).status, 400);
  const requested = await (await patch({ rematchAction: 'request' })).json();
  const rematchRequestId = requested.room.rematchRequest.id;
  assert.equal((await patch({ rematchAction: 'accept', rematchRequestId })).status, 403);
  const accepted = await patch({ rematchAction: 'accept', rematchRequestId }, g.membershipToken);
  assert.equal(accepted.status, 200);
  const next = await accepted.json();
  assert.equal(next.room.status, 'waiting');
  assert.notEqual(next.room.roundId, room.roundId);
  assert.deepEqual(next.guesses, []);
  assert.equal(next.hint, null);
});
