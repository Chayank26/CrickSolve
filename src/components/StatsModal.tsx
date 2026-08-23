'use client';

import { useGameStore } from '@/store/useGameStore';
import { X, BarChart2, Award, Trophy, Target, CheckCircle2 } from 'lucide-react';

export function StatsModal() {
  const { activeModal, setActiveModal, gamesPlayed, gamesWon, streak, maxStreak } = useGameStore();

  if (activeModal !== 'stats') return null;

  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-5 text-black animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b-3 border-black pb-3">
          <div className="flex items-center gap-3">
            <div className="bg-[#CCFF00] border-2 border-black p-2 text-black">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-black">YOUR STATS</h2>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="bg-white border-2 border-black p-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-100"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* 5 Stat Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 text-center">
          {/* Played */}
          <div className="p-3.5 bg-slate-100 border-3 border-black flex flex-col items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-2xl font-black text-black">{gamesPlayed}</div>
            <div className="text-xs font-black uppercase text-slate-600 flex items-center gap-1">
              <Target className="w-3.5 h-3.5" /> Played
            </div>
          </div>

          {/* Solved */}
          <div className="p-3.5 bg-slate-100 border-3 border-black flex flex-col items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-2xl font-black text-black">{gamesWon}</div>
            <div className="text-xs font-black uppercase text-slate-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Solved
            </div>
          </div>

          {/* Win % */}
          <div className="p-3.5 bg-[#CCFF00] border-3 border-black flex flex-col items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] col-span-2">
            <div className="text-3xl font-black text-black">{winRate}%</div>
            <div className="text-xs font-black uppercase text-black flex items-center gap-1">
              <Award className="w-4 h-4 text-black" /> Win Rate
            </div>
          </div>

          {/* Current Streak */}
          <div className="p-3.5 bg-slate-100 border-3 border-black flex flex-col items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-2xl font-black text-black">{streak}</div>
            <div className="text-xs font-black uppercase text-slate-600">Current Streak</div>
          </div>

          {/* Max Streak */}
          <div className="p-3.5 bg-[#7E22CE] text-white border-3 border-black flex flex-col items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-2xl font-black">{maxStreak}</div>
            <div className="text-xs font-black uppercase text-white flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-[#CCFF00]" /> Max Streak
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setActiveModal(null)}
            className="bg-black text-[#CCFF00] hover:bg-slate-900 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-6 py-2 text-xs font-black uppercase active:translate-x-0.5 active:translate-y-0.5"
          >
            CLOSE STATS
          </button>
        </div>
      </div>
    </div>
  );
}
