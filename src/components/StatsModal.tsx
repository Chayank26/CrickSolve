'use client';

import { useGameStore } from '@/store/useGameStore';
import { X, Trophy, Flame, Target, BarChart2 } from 'lucide-react';

export function StatsModal() {
  const { activeModal, setActiveModal, gamesPlayed, gamesWon, streak, maxStreak, guesses } = useGameStore();

  if (activeModal !== 'stats') return null;

  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-100">Your CrickSolve Stats</h2>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Key Stat Metrics */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col items-center justify-center">
            <div className="text-xl font-extrabold text-slate-100">{gamesPlayed}</div>
            <div className="text-[10px] text-slate-400 font-medium">Played</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col items-center justify-center">
            <div className="text-xl font-extrabold text-emerald-400">{winRate}%</div>
            <div className="text-[10px] text-slate-400 font-medium">Win Rate</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col items-center justify-center">
            <div className="text-xl font-extrabold text-amber-400">{streak}</div>
            <div className="text-[10px] text-slate-400 font-medium">Current</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col items-center justify-center">
            <div className="text-xl font-extrabold text-cyan-400">{maxStreak}</div>
            <div className="text-[10px] text-slate-400 font-medium">Max Streak</div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
