'use client';

import { useGameStore } from '@/store/useGameStore';
import { X, HelpCircle, Trophy, Lightbulb, ArrowUp, ArrowDown } from 'lucide-react';

export function HowToModal() {
  const { activeModal, setActiveModal } = useGameStore();

  if (activeModal !== 'howTo') return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-100">How to Play CrickSolve 🏏</h2>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-300">
          <p>
            • Search and guess a cricketer from the database. You have <strong>7 tries</strong> (plus 1 optional bonus try).
          </p>
          <p>
            • Matching <strong>Attributes</strong> (Country, Batting Hand, Bowling Type, Role, IPL Team, Retired) shatter & unlock.
          </p>
          <p className="flex items-center gap-1.5">
            • <strong>Numeric Hints</strong> show <ArrowUp className="w-3.5 h-3.5 text-amber-400 inline" /> if the mystery player's stat is higher and <ArrowDown className="w-3.5 h-3.5 text-cyan-400 inline" /> if lower.
          </p>
          <p>
            • After <strong>4 guesses</strong>, unlock 1 tactical hint (Jersey Number, Teammate, Signature Performance).
          </p>
          <p>
            • The <strong>Photo Silhouette</strong> unblurs with every attempt made.
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
          >
            Got It, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
}
