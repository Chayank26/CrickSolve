'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { PLAYERS } from '@/data/players';
import { getDailyTargetPlayer, evaluatePlayerGuess } from '@/lib/game-engine';
import { Lightbulb } from 'lucide-react';
import Fuse from 'fuse.js';

export function PlayerSearch() {
  const { guesses, addGuess, unlockedHint, setActiveModal, gameStatus, currentDate, gameMode, unlimitedTargetId } = useGameStore();

  const [query, setQuery] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const isGameOver = gameStatus !== 'IN_PROGRESS';

  // Resolve target player across full player pool
  let targetPlayer = getDailyTargetPlayer(currentDate, 'International');
  if (gameMode === 'unlimited' && unlimitedTargetId) {
    const found = PLAYERS.find((p) => p.id === unlimitedTargetId);
    if (found) targetPlayer = found;
  }

  // Full available player search pool
  const availablePlayers = PLAYERS;

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
  const currentGuessNum = Math.min(7, guesses.length + 1);

  return (
    <div className="bg-[#7E22CE] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row items-stretch gap-3 relative">
        {/* Search Input Box */}
        <div className="relative flex-1">
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
            placeholder={isGameOver ? 'GAME FINISHED' : 'Enter Cricketer Name (e.g. Virat Kohli)...'}
            className="w-full bg-white text-black font-black placeholder-slate-400 border-3 border-black px-4 py-3.5 text-sm sm:text-base uppercase focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-70"
          />

          {/* Autocomplete Suggestions Menu */}
          {isFocused && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-30 divide-y-2 divide-black">
              {suggestions.map((player) => (
                <div
                  key={player.id}
                  onMouseDown={() => handleSelectPlayer(player.id, player.name)}
                  className="p-3 hover:bg-[#CCFF00] cursor-pointer transition-colors flex items-center justify-between text-black"
                >
                  <div>
                    <div className="text-sm font-black uppercase text-black">{player.name}</div>
                    <div className="text-xs font-bold text-slate-700 uppercase">
                      {player.country} • {player.role}
                    </div>
                  </div>
                  <div className="text-xs font-black text-black bg-[#CCFF00] border border-black px-2 py-0.5 uppercase">
                    {player.battingHand.includes('Left') ? 'LHB' : 'RHB'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Big Neon Yellow GUESS (X/7) Button */}
        <button
          onClick={handleGuessSubmit}
          disabled={isGameOver || (!selectedPlayerId && !query.trim())}
          className="bg-[#CCFF00] hover:brightness-105 active:translate-x-0.5 active:translate-y-0.5 text-black font-black border-3 border-black px-6 py-3.5 text-sm sm:text-base uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-60 whitespace-nowrap"
        >
          GUESS ({currentGuessNum}/7)
        </button>
      </div>

      {/* Hint Trigger Button (If available) */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            if (isHintAvailable) {
              setActiveModal('hintPicker');
            }
          }}
          disabled={!isHintAvailable || isGameOver}
          className="bg-white hover:bg-slate-100 text-black border-2 border-black px-3.5 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 flex items-center gap-1.5"
        >
          <Lightbulb className="w-3.5 h-3.5 text-black" />
          <span>{unlockedHint ? `HINT: ${unlockedHint}` : 'USE HINT (AVAILABLE AFTER 4 GUESSES)'}</span>
        </button>
      </div>
    </div>
  );
}
