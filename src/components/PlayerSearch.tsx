'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { PLAYERS } from '@/data/players';
import { Player } from '@/types/game';
import { useGameStore } from '@/store/useGameStore';
import { playFlipSound, playWinSound } from '@/lib/audio';
import Fuse from 'fuse.js';
import { Loader2 } from 'lucide-react';

export function PlayerSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { guesses, gameStatus, gameMode, category, currentDate, unlimitedTargetId, addGuess, soundEnabled } = useGameStore();

  const containerRef = useRef<HTMLDivElement>(null);

  // Fuse.js search index
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
    const guessedIds = new Set(guesses.map((g) => g.guessedPlayer.id));
    return results.filter((p) => !guessedIds.has(p.id)).slice(0, 6);
  }, [query, fuse, guesses]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

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
        if (data.evaluation.isCorrect) {
          playWinSound(soundEnabled);
        } else {
          playFlipSound(soundEnabled);
        }
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

  const guessCountDisplay = Math.min(7, guesses.length + 1);

  return (
    <div className="w-full relative">
      {/* Purple Input Block */}
      <div className="bg-[#6B21A8] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 md:p-5 relative overflow-visible">
        {/* Top-Right Neon Lime Accent Corner */}
        <div className="absolute top-0 right-0 w-0 h-0 border-t-[28px] border-t-[#CCFF00] border-l-[28px] border-l-transparent" />

        <div ref={containerRef} className="relative w-full flex flex-col md:flex-row items-center gap-3">
          {/* Input Field */}
          <div className="relative flex-1 w-full">
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
              placeholder="Enter Cricketer Name (e.g. Virat Kohli)..."
              className="w-full bg-white text-black font-semibold placeholder:text-slate-500 border-3 border-black p-3.5 text-sm md:text-base focus:outline-none focus:ring-4 focus:ring-black transition-all disabled:bg-slate-200"
            />

            {isLoading && (
              <div className="absolute right-3.5 top-3.5">
                <Loader2 className="w-5 h-5 text-black animate-spin" />
              </div>
            )}

            {/* Autocomplete Dropdown */}
            {isOpen && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-50 divide-y-2 divide-black overflow-hidden">
                {searchResults.map((player, index) => (
                  <button
                    key={player.id}
                    onClick={() => handleSelectPlayer(player)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                      index === selectedIndex ? 'bg-[#CCFF00] text-black font-extrabold' : 'hover:bg-slate-100 text-black font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={player.photoUrl} alt={player.name} className="w-8 h-8 rounded-none border-2 border-black object-cover bg-slate-200" />
                      <div>
                        <div className="text-sm font-extrabold">{player.name}</div>
                        <div className="text-xs font-semibold opacity-70">
                          {player.country} • {player.role}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* GUESS (X/7) Action Button */}
          <button
            onClick={() => {
              if (searchResults.length > 0) {
                handleSelectPlayer(searchResults[0]);
              }
            }}
            disabled={gameStatus !== 'IN_PROGRESS' || isLoading || !query.trim()}
            className="w-full md:w-auto bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black uppercase text-base border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-6 py-3.5 whitespace-nowrap active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            GUESS ({guessCountDisplay}/7)
          </button>
        </div>
      </div>
    </div>
  );
}
