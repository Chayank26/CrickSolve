'use client';

import { useGameStore } from '@/store/useGameStore';
import { PlayerCategory } from '@/types/game';
import { Volume2, VolumeX, HelpCircle, Trophy, BarChart2, Calendar, Repeat } from 'lucide-react';

export function Header() {
  const { streak, soundEnabled, toggleSound, setActiveModal, gameMode, setGameMode, category, setCategory, userRank } = useGameStore();

  const categories: PlayerCategory[] = ['International', 'IPL', 'Legend', 'Womens'];

  return (
    <header className="w-full flex flex-col md:flex-row items-center justify-between gap-4 py-4 border-b border-white/10 mb-2">
      {/* Title & Format Dropdown Left */}
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          CrickSolve 🏏
        </h1>

        {/* Format Dropdown Selector */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as PlayerCategory)}
          className="bg-slate-800 text-white font-bold text-xs md:text-sm px-3.5 py-2 rounded-xl border border-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'IPL' ? 'IPL Stars' : cat === 'Womens' ? "Women's Cricket" : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Badges & Action Buttons Right */}
      <div className="flex items-center flex-wrap gap-2.5 text-xs font-bold">
        {/* Streak Badge */}
        <div className="bg-slate-800/80 text-white border border-white/10 px-3.5 py-2 rounded-xl">
          STREAK: <span className="text-emerald-400 font-extrabold">{streak}</span>
        </div>

        {/* Standing Rank Badge */}
        <div className="bg-slate-800/80 text-emerald-400 border border-white/10 px-3.5 py-2 rounded-xl flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-emerald-400" />
          <span>STANDING: {userRank ? `#${userRank}` : '--'}</span>
        </div>

        {/* How to Play */}
        <button
          onClick={() => setActiveModal('howTo')}
          className="comic-button px-3.5 py-2 rounded-xl transition-all"
        >
          How to Play
        </button>

        {/* Past Games */}
        <button
          onClick={() => setActiveModal('calendar')}
          className="btn-ghost-dark px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Past Games</span>
        </button>

        {/* Mode Switcher */}
        <button
          onClick={() => setGameMode(gameMode === 'daily' ? 'unlimited' : 'daily')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
            gameMode === 'unlimited'
              ? 'bg-blue-600 text-white font-extrabold shadow-lg shadow-blue-500/20'
              : 'btn-ghost-dark'
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>{gameMode === 'daily' ? 'Switch to Practice Mode' : 'Practice Mode (Active)'}</span>
        </button>

        {/* Your Stats */}
        <button
          onClick={() => setActiveModal('stats')}
          className="btn-ghost-dark px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
        >
          <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Stats</span>
        </button>

        {/* Leaderboard */}
        <button
          onClick={() => setActiveModal('leaderboard')}
          className="btn-primary-green px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all"
        >
          <Trophy className="w-4 h-4 text-emerald-950" />
          <span>Leaderboard</span>
        </button>

        {/* Sound Mute */}
        <button
          onClick={toggleSound}
          className="btn-ghost-dark p-2 rounded-xl"
          title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-500" />}
        </button>
      </div>
    </header>
  );
}
