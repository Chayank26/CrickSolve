'use client';

import { useGameStore } from '@/store/useGameStore';
import { X, BarChart2 } from 'lucide-react';

export function StatsModal() {
  const { activeModal, setActiveModal, gamesPlayed, gamesWon, streak, maxStreak } = useGameStore();

  if (activeModal !== 'stats') return null;

  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-5 text-black animate-in fade-in zoom-in-95 duration-150">
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

        {/* 4 Stat Metrics Box */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-3 bg-slate-100 border-2 border-black flex flex-col items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xl font-black text-black">{gamesPlayed}</div>
            <div className="text-[10px] font-bold uppercase text-slate-600">Played</div>
          </div>
          <div className="p-3 bg-[#CCFF00] border-2 border-black flex flex-col items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xl font-black text-black">{winRate}%</div>
            <div className="text-[10px] font-bold uppercase text-black">Win %</div>
          </div>
          <div className="p-3 bg-slate-100 border-2 border-black flex flex-col items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xl font-black text-black">{streak}</div>
            <div className="text-[10px] font-bold uppercase text-slate-600">Streak</div>
          </div>
          <div className="p-3 bg-[#7E22CE] text-white border-2 border-black flex flex-col items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xl font-black">{maxStreak}</div>
            <div className="text-[10px] font-bold uppercase text-white">Max</div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setActiveModal(null)}
            className="bg-black text-white hover:bg-slate-900 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-6 py-2 text-xs font-black uppercase active:translate-x-0.5 active:translate-y-0.5"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
