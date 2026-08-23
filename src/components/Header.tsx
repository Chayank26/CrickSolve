'use client';

import { useGameStore } from '@/store/useGameStore';
import { Volume2, VolumeX, HelpCircle } from 'lucide-react';

export function Header() {
  const { streak, soundEnabled, toggleSound, setActiveModal, gameMode, setGameMode } = useGameStore();

  return (
    <header className="w-full flex flex-col gap-5 pt-4 pb-2">
      {/* Top Banner Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Giant Neubrutalist Logo Banner */}
        <div className="bg-[#CCFF00] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] px-6 py-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-black uppercase">
            CRICKSOLVE
          </h1>
        </div>

        {/* Top Badges */}
        <div className="flex items-center flex-wrap gap-3 text-xs md:text-sm font-extrabold uppercase">
          {/* Daily Puzzle # */}
          <div className="bg-white border-3 border-black px-4 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black">
            DAILY #142
          </div>

          {/* Streak */}
          <div className="bg-white border-3 border-black px-4 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black">
            STREAK: {streak}
          </div>

          {/* Global Rank */}
          <div className="bg-black border-3 border-black px-4 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-[#CCFF00]">
            RANK: #422
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="bg-white border-3 border-black p-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-black" /> : <VolumeX className="w-4 h-4 text-red-600" />}
          </button>
        </div>
      </div>

      {/* Horizontal Divider Line */}
      <div className="w-full border-b-4 border-black my-1" />

      {/* Controls & Mode Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Mode Tabs */}
        <div className="flex items-center flex-wrap gap-3">
          <button
            onClick={() => setGameMode('daily')}
            className={`px-5 py-2 text-xs md:text-sm font-black border-3 border-black uppercase transition-all ${
              gameMode === 'daily'
                ? 'bg-[#7E22CE] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black hover:bg-slate-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            DAILY MODE
          </button>

          <button
            onClick={() => setGameMode('unlimited')}
            className={`px-5 py-2 text-xs md:text-sm font-black border-3 border-black uppercase transition-all ${
              gameMode === 'unlimited'
                ? 'bg-[#7E22CE] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black hover:bg-slate-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            UNLIMITED
          </button>

          <button
            onClick={() => setActiveModal('calendar')}
            className="bg-white text-black hover:bg-slate-100 px-5 py-2 text-xs md:text-sm font-black border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase transition-all"
          >
            PAST GAMES
          </button>
        </div>

        {/* Action Buttons Right */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveModal('stats')}
            className="bg-[#CCFF00] text-black font-black px-6 py-2 text-xs md:text-sm border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase hover:brightness-105 active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            LEADERBOARD
          </button>

          <button
            onClick={() => setActiveModal('howTo')}
            className="bg-white border-3 border-black p-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            title="How to Play"
          >
            <HelpCircle className="w-5 h-5 text-black" />
          </button>
        </div>
      </div>
    </header>
  );
}
