'use client';

import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import { useGameStore } from '@/store/useGameStore';
import { X, HelpCircle } from 'lucide-react';

export function HowToModal() {
  const { activeModal, closeHowTo } = useGameStore();

  const inMultiplayer = useMultiplayerStore((state) => !!state.room);
  if (activeModal !== 'howTo') return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-5 text-black animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-3 border-black pb-3">
          <div className="flex items-center gap-3">
            <div className="bg-[#CCFF00] border-2 border-black p-2 text-black">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-black">
              HOW TO PLAY CRICKSOLVE
            </h2>
          </div>
          <button
            onClick={closeHowTo}
            className="bg-white border-2 border-black p-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-100"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Rules Content */}
        <div className="flex flex-col gap-3 text-xs md:text-sm font-bold text-slate-800 leading-relaxed">
          <div className="p-3 bg-slate-100 border-2 border-black">
            • Search and guess a cricketer from the database. You have <strong>7 tries</strong>{inMultiplayer ? ', with no extra attempt.' : ' (plus 1 bonus try).'}
          </div>
          <div className="p-3 bg-slate-100 border-2 border-black">
            • Matching <strong>Attributes</strong> (Country, Batting, Role, IPL Team) shatter & unlock in <span className="bg-[#CCFF00] px-1 border border-black text-black">NEON LIME</span>.
          </div>
          <div className="p-3 bg-slate-100 border-2 border-black flex items-center gap-1.5 flex-wrap">
            • <strong>Numeric Hints</strong> show <span className="bg-white px-1.5 border border-black font-extrabold">↑</span> if mystery stat is higher and <span className="bg-white px-1.5 border border-black font-extrabold">↓</span> if lower.
          </div>
          <div className="p-3 bg-slate-100 border-2 border-black">
            • After <strong>4 guesses</strong>, choose one locked attribute card to reveal as your bonus hint.
          </div>
          <div className="p-3 bg-slate-100 border-2 border-black">
            {inMultiplayer ? '• Solve first to win. The photo is revealed when the round ends. If both players use all seven guesses, there is no winner. Reconnect within 60 seconds of your last contact or forfeit. Leaving an active duel forfeits immediately; lobby ownership transfers when the host leaves.' : <>• The <strong>Photo Silhouette</strong> unblurs with every attempt made.</>}
          </div>
        </div>

        {/* Got It Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={closeHowTo}
            className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black uppercase text-sm border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-3 active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            GOT IT, LET&apos;S PLAY!
          </button>
        </div>
      </div>
    </div>
  );
}
