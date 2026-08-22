'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { PLAYERS } from '@/data/players';
import { Player } from '@/types/game';
import { useGameStore } from '@/store/useGameStore';
import Fuse from 'fuse.js';
import { Search, Send, Lightbulb, Loader2 } from 'lucide-react';

export function PlayerSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { guesses, gameStatus, gameMode, category, currentDate, unlimitedTargetId, addGuess, unlockHintManually, unlockedHint } = useGameStore();

  const containerRef = useRef<HTMLDivElement>(null);

  // Setup Fuse.js instance for fuzzy searching player names and countries
  const fuse = useMemo(() => {
    const pool = PLAYERS.filter((p) => {
      if (category === 'International') return true;
      return p.category === category || (category === 'IPL' && p.iplTeam !== 'None');
    });

    return new Fuse(pool, {
      keys: ['name', 'country', 'iplTeam'],
      threshold: 0.3,
    });
  }, [category]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const results = fuse.search(query).map((res) => res.item);
    // Filter out players already guessed
    const guessedIds = new Set(guesses.map((g) => g.guessedPlayer.id));
    return results.filter((p) => !guessedIds.has(p.id)).slice(0, 6);
  }, [query, fuse, guesses]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSelectPlayer(player: Player) {
    if (gameStatus !== 'IN_PROGRESS' || isLoading) return;

    setIsLoading(true);
    setIsOpen(false);
    setQuery('');

    try {
      const res = await fetch('/api/puzzle/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guessedPlayerId: player.id,
          date: currentDate,
          category,
          mode: gameMode,
          targetPlayerId: gameMode === 'unlimited' ? unlimitedTargetId : undefined,
          attemptNumber: guesses.length + 1,
        }),
      });

      const data = await res.json();
      if (data.evaluation) {
        addGuess(data.evaluation);
      }
    } catch (err) {
      console.error('Failed to evaluate guess', err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        handleSelectPlayer(searchResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  const guessesLeft = Math.max(0, 7 - guesses.length);
  const isHintAvailable = guesses.length >= 4 && !unlockedHint;

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 md:p-6 backdrop-blur-md shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>Make Your Guess</span>
          </h2>
          <p className="text-xs text-slate-400">Search and select a cricketer from the database.</p>
        </div>
        <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-cyan-300">
          {guessesLeft} {guessesLeft === 1 ? 'Guess Left' : 'Guesses Left'}
        </div>
      </div>

      <div ref={containerRef} className="relative w-full">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            disabled={gameStatus !== 'IN_PROGRESS' || isLoading}
            placeholder={gameStatus === 'IN_PROGRESS' ? 'Type player name (e.g. Kohli, Bumrah, Smith)...' : 'Game Finished'}
            className="w-full pl-10 pr-12 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
          />
          {isLoading && (
            <div className="absolute right-3">
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
            </div>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {isOpen && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800">
            {searchResults.map((player, index) => (
              <button
                key={player.id}
                onClick={() => handleSelectPlayer(player)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                  index === selectedIndex ? 'bg-emerald-950/70 text-emerald-200' : 'hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0">
                    <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{player.name}</div>
                    <div className="text-xs text-slate-400">
                      {player.country} • {player.role}
                    </div>
                  </div>
                </div>
                <Send className="w-4 h-4 text-slate-400" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tactical Hint Button */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
        <button
          onClick={unlockHintManually}
          disabled={!isHintAvailable}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>{unlockedHint ? 'Hint Unlocked' : isHintAvailable ? 'Unlock Tactical Hint (1)' : 'Hint Available at 4 Guesses'}</span>
        </button>

        {unlockedHint && <div className="text-xs font-medium text-amber-300 bg-amber-950/60 px-3 py-1 rounded-lg border border-amber-500/40">{unlockedHint}</div>}
      </div>
    </div>
  );
}
