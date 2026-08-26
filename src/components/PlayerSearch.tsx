'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { PLAYERS } from '@/data/players';
import { getDailyTargetPlayer, evaluatePlayerGuess } from '@/lib/game-engine';
import { Search, Lightbulb, CheckCircle2 } from 'lucide-react';
import Fuse from 'fuse.js';

export function PlayerSearch() {
  const { guesses, addGuess, unlockedHint, setActiveModal, gameStatus, category, currentDate, gameMode, unlimitedTargetId } = useGameStore();

  const [query, setQuery] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const isGameOver = gameStatus !== 'IN_PROGRESS';

  // Resolve target player
  let targetPlayer = getDailyTargetPlayer(currentDate, category);
  if (gameMode === 'unlimited' && unlimitedTargetId) {
    const found = PLAYERS.find((p) => p.id === unlimitedTargetId);
    if (found) targetPlayer = found;
  }

  // Filter pool by category
  const availablePlayers = useMemo(() => {
    if (category === 'International') return PLAYERS;
    return PLAYERS.filter((p) => p.category === category || (category === 'IPL' && p.iplTeam !== 'None'));
  }, [category]);

  // Configure Fuse.js fuzzy search engine
  const fuse = useMemo(() => {
    return new Fuse(availablePlayers, {
      keys: ['name', 'country', 'iplTeam'],
      threshold: 0.35,
    });
  }, [availablePlayers]);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const guessedIds = new Set(guesses.map((g) => g.guessedPlayer.id));
    const results = fuse.search(query);
    return results
      .map((r) => r.item)
      .filter((p) => !guessedIds.has(p.id))
      .slice(0, 5);
  }, [query, fuse, guesses]);

  const handleSelectPlayer = (playerId: string, name: string) => {
    setSelectedPlayerId(playerId);
    setQuery(name);
    setIsFocused(false);
  };

  const handleGuessSubmit = () => {
    if (isGameOver) return;

    let targetId = selectedPlayerId;
    if (!targetId && query.trim()) {
      const match = availablePlayers.find((p) => p.name.toLowerCase() === query.trim().toLowerCase());
      if (match) targetId = match.id;
      else if (suggestions.length > 0) targetId = suggestions[0].id;
    }

    if (targetId) {
      const evaluation = evaluatePlayerGuess(targetId, targetPlayer.id, guesses.length + 1);
      if (evaluation) {
        addGuess(evaluation);
      }
      setQuery('');
      setSelectedPlayerId(null);
    }
  };

  const isHintAvailable = guesses.length >= 4 && !unlockedHint;
  const guessesLeft = Math.max(0, 7 - guesses.length);

  return (
    <div className="card-dark p-5 flex flex-col gap-4">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            Guess
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Search and select a player.</p>
        </div>
        <div className="text-xs font-extrabold text-emerald-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-white/10">
          Guesses left: {guessesLeft} / 7
        </div>
      </div>

      {/* Input Field & Suggestions Dropdown */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedPlayerId(null);
            }}
            onFocus={() => setIsFocused(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleGuessSubmit();
            }}
            disabled={isGameOver}
            placeholder={isGameOver ? 'Game finished' : 'Enter cricketer name...'}
            className="w-full pl-10 pr-4 py-3 bg-slate-900/90 text-white placeholder-slate-500 rounded-xl border border-white/15 focus:outline-none focus:border-emerald-500 text-sm font-semibold transition-all disabled:opacity-50"
          />
        </div>

        {/* Autocomplete Suggestions Menu */}
        {isFocused && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-white/15 rounded-xl overflow-hidden shadow-2xl z-30 divide-y divide-white/5">
            {suggestions.map((player) => (
              <div
                key={player.id}
                onMouseDown={() => handleSelectPlayer(player.id, player.name)}
                className="p-3 hover:bg-emerald-500/15 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-bold text-white">{player.name}</div>
                  <div className="text-xs text-slate-400">
                    {player.country} • {player.role}
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                  {player.battingHand.includes('Left') ? 'LHB' : 'RHB'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleGuessSubmit}
          disabled={isGameOver || (!selectedPlayerId && !query.trim())}
          className="btn-primary-green px-6 py-2.5 rounded-xl text-sm font-extrabold transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Guess</span>
        </button>

        <button
          onClick={() => {
            if (isHintAvailable) {
              setActiveModal('hintPicker');
            }
          }}
          disabled={!isHintAvailable || isGameOver}
          className="btn-ghost-dark px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 flex items-center gap-2"
        >
          <Lightbulb className="w-4 h-4 text-emerald-400" />
          <span>{unlockedHint ? `Hint: ${unlockedHint}` : 'Use Hint (1)'}</span>
        </button>
      </div>
    </div>
  );
}
