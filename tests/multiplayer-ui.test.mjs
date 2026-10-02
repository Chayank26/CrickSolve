import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import test from 'node:test';
import { createLoader } from './helpers/load-typescript.mjs';

function render(component, { hint = null, selecting = false, status = 'in_progress', count = 4, finishReason } = {}) {
  const room = { id: 'room', roundId: 'round', roomCode: 'ABCDEF', status, finishReason, startedAt: 1000,
    participants: [{ userId: 'host', guessesCount: count }], winnerUserId: status === 'finished' ? 'host' : undefined };
  const guesses = Array.from({ length: count }, (_, i) => ({ guessedPlayer: { id: `p${i}`, name: `Player ${i}` },
    isCorrect: false, attributeMatches: { country: false, battingHand: false, bowlingType: false, role: false, iplTeam: false, retired: false }, numericMatches: {} }));
  const active = { guesses, gameStatus: 'IN_PROGRESS', currentDate: '2026-09-28', gameMode: 'multiplayer', unlimitedTargetId: null,
    category: 'International', isHintSelecting: selecting, manuallyUnlockedAttributes: hint ? { [hint.key]: hint.value } : {},
    unlockedHint: hint ? `COUNTRY: ${hint.value}` : null, soundEnabled: true, streak: 10, startTimeMs: 1000, endTimeMs: null,
    activeModal: component === 'ResultModal' ? 'result' : component === 'ShareGridModal' ? 'share' : component === 'HowToModal' ? 'howTo' : null,
  };
  const multiplayer = { room, hint, userId: 'host', guesses, isClaimingHint: false };
  const useMultiplayerStore = (selector) => selector ? selector(multiplayer) : multiplayer;
  const filename = component === 'HowToModal' ? 'TacticalHintModal' : component;
  const load = createLoader({ modules: {
    '@/components/RematchControls': { RematchControls: () => null },
    '@/hooks/useActiveGame': { useActiveGame: () => active },
    '@/store/useGameStore': { useGameStore: () => active },
    '@/store/useMultiplayerStore': { useMultiplayerStore },
  } });
  return renderToStaticMarkup(createElement(load(`src/components/${filename}.tsx`)[component]));
}

test('bonus cards are accessible buttons and show the server hint value', () => {
  const html = render('AttributeCards', { hint: { key: 'country', value: 'India' } });
  assert.match(html, /aria-label="COUNTRY: India"/);
  assert.match(html, /HIDDEN UNTIL ROUND ENDS/);
  assert.doesNotMatch(html, /src="[^\"]*players\//);
  const selecting = render('AttributeCards', { selecting: true });
  assert.match(selecting, /CLICK TO UNLOCK/);
  assert.match(selecting, /<button[^>]*aria-label="COUNTRY: locked"/);
});

test('multiplayer header names the mode and disables solo mode changes', () => {
  const html = render('Header');
  assert.match(html, /MULTIPLAYER • 7 GUESSES/);
  assert.match(html, /<span>1v1 BATTLE<\/span>/);
  assert.doesNotMatch(html, /\u26a1/);
  assert.match(html, /Leave the duel to switch modes/);
  assert.equal((html.match(/disabled=""/g) || []).length, 3);
});

test('search offers the fourth-guess hint and shows exhaustion without an extra attempt', () => {
  const html = render('PlayerSearch');
  assert.match(html, /BONUS HINT/);
  const exhausted = render('PlayerSearch', { count: 7 });
  assert.match(exhausted, /NO GUESSES LEFT/);
  assert.doesNotMatch(exhausted, /8th|eighth/i);
});

test('multiplayer rules and share cards describe the duel without solo streaks or extra attempts', () => {
  const rules = render('HowToModal');
  assert.match(rules, /no extra attempt/);
  assert.match(rules, /choose one locked attribute/);
  const share = render('ShareGridModal', { status: 'finished' });
  assert.match(share, /CrickSolve 1v1/);
  assert.match(share, /Won the duel/);
  assert.doesNotMatch(share, /Streak:/);
});

test('rematch controls distinguish request, waiting, acceptance and draw states', () => {
  const state = { userId: 'host', room: { status: 'finished', finishReason: 'exhausted' } };
  const load = createLoader({ modules: { '@/store/useMultiplayerStore': { useMultiplayerStore: () => state } } });
  const Controls = load('src/components/RematchControls.tsx').RematchControls;
  const html = () => renderToStaticMarkup(createElement(Controls));
  assert.match(html(), /Request rematch/);
  state.room.rematchRequest = { id: 'request', requestedBy: 'host' };
  assert.match(html(), /Waiting for opponent/);
  assert.match(html(), /Cancel request/);
  assert.doesNotMatch(html(), /Accept rematch/);
  state.userId = 'guest';
  assert.match(html(), /Accept rematch/);
  assert.match(html(), /Decline/);
  state.isReconnecting = true;
  assert.equal((html().match(/disabled=""/g) || []).length, 2);
  state.room.status = 'waiting';
  assert.equal(html(), '');
});

test('forfeit results and shares do not claim a solved puzzle', () => {
  const result = render('ResultModal', { status: 'finished', finishReason: 'forfeit' });
  assert.match(result, /WIN BY FORFEIT/);
  assert.match(result, /did not reconnect within 60 seconds/);
  assert.doesNotMatch(result, /You solved the puzzle|SOLVE TIME:/);
  const share = render('ShareGridModal', { status: 'finished', finishReason: 'forfeit' });
  assert.match(share, /Won by forfeit/);
});
