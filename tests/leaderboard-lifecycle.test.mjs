import assert from 'node:assert/strict';
import test from 'node:test';
import { createLoader } from './helpers/load-typescript.mjs';

function setup() {
  let effect;
  let stateIndex = 0;
  const state = [];
  const timers = new Map();
  const pending = [];
  const ranks = [];
  const game = { activeModal: 'leaderboard', currentDate: '2026-10-01', category: 'International', nickname: 'You' };
  const store = Object.assign(() => game, { getState: () => ({ ...game, setUserRank: (rank) => ranks.push(rank) }) });
  const load = createLoader({
    globals: {
      AbortController,
      setTimeout: (callback) => { const id = timers.size + 1; timers.set(id, callback); return id; },
      clearTimeout: (id) => timers.delete(id),
      localStorage: { getItem: () => null },
      fetch: (_url, options) => new Promise((resolve) => pending.push({ resolve, signal: options.signal })),
    },
    modules: {
      react: { useEffect: (callback) => { effect = callback; }, useState: (initial) => {
        const i = stateIndex++; return [state[i] ?? initial, (value) => { state[i] = value; }];
      } },
      '@/store/useGameStore': { useGameStore: store },
    },
  });
  const Modal = load('src/components/LeaderboardModal.tsx').LeaderboardModal;
  return { state, pending, ranks, game,
    mount: () => { stateIndex = 0; Modal(); return effect(); },
    start: () => { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach((callback) => callback()); },
  };
}
const flush = () => new Promise((resolve) => setImmediate(resolve));
const response = (nickname) => ({ json: async () => ({ leaderboard: [{ nickname, attempts: 1, timeMs: 1000 }] }) });

test('closing the leaderboard before its scheduled load makes no request', () => {
  const f = setup(); const cleanup = f.mount(); cleanup(); f.start();
  assert.equal(f.pending.length, 0);
});

test('stale leaderboard responses cannot replace a newer date or update rank', async () => {
  const f = setup(); const cleanup = f.mount(); f.start();
  cleanup();
  assert.equal(f.pending[0].signal.aborted, true);
  f.game.currentDate = '2026-10-02';
  f.mount(); f.start();
  f.pending[1].resolve(response('You')); await flush();
  assert.equal(f.state[0][0].nickname, 'You');
  assert.deepEqual(f.ranks, [1]);
  // Simulate a transport that completes even after cancellation.
  f.pending[0].resolve(response('Stale player')); await flush();
  assert.equal(f.state[0][0].nickname, 'You');
  assert.deepEqual(f.ranks, [1]);
});
