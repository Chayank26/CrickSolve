'use client';

import { useGameStore } from '@/store/useGameStore';
import { Flame, HelpCircle, Calendar, Trophy, Volume2, VolumeX, Sparkles } from 'lucide-react';

export function Header() {
  const { streak, soundEnabled, toggleSound, setActiveModal, gameMode, setGameMode, category, setCategory } = useGameStore();

  return (
    <header className="w-full border-b border-emerald-500/20 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="text-3xl animate-bounce">🏏</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                CrickSolve
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-medium">
                {gameMode === 'daily' ? `Daily • ${category}` : 'Unlimited'}
              </span>
            </div>
            <p className="text-xs text-slate-400">Guess the mystery cricketer in 7 tries</p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Streak Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold text-sm">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
            <span>Streak: {streak}</span>
          </div>

          {/* Mode Switcher */}
          <button
            onClick={() => setGameMode(gameMode === 'daily' ? 'unlimited' : 'daily')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium transition-all"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>{gameMode === 'daily' ? 'Play Unlimited' : 'Play Daily'}</span>
          </button>

          {/* Past Games Button */}
          <button
            onClick={() => setActiveModal('calendar')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium transition-all"
          >
            <Calendar className="w-4 h-4 text-teal-400" />
            <span className="hidden sm:inline">Past Games</span>
          </button>

          {/* How to Play */}
          <button
            onClick={() => setActiveModal('howTo')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all"
            title="How to Play"
          >
            <HelpCircle className="w-4 h-4 text-slate-300" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all"
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>
        </div>
      </div>
    </header>
  );
}
