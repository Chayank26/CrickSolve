'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { X, Share2, Copy, Check } from 'lucide-react';

export function ShareGridModal() {
  const { activeModal, setActiveModal, guesses, streak, currentDate } = useGameStore();
  const [copied, setCopied] = useState(false);

  if (activeModal !== 'share') return null;

  // Build Wordle-style emoji grid string
  const emojiGrid = guesses
    .map((g) => {
      const countryEmoji = g.attributeMatches.country ? '🟩' : '⬛';
      const roleEmoji = g.attributeMatches.role ? '🟩' : '⬛';
      const teamEmoji = g.attributeMatches.iplTeam ? '🟩' : '⬛';
      const yearEmoji = g.numericMatches.birthYear === 'match' ? '🟩' : g.numericMatches.birthYear === 'higher' ? '⬆️' : '⬇️';
      return `${countryEmoji}${roleEmoji}${teamEmoji}${yearEmoji}`;
    })
    .join('\n');

  const shareText = `CrickSolve 🏏 ${currentDate}\nGuesses: ${guesses.length}/7 • Streak: ${streak}🔥\n\n${emojiGrid}\n\nPlay at: https://cricksolve.vercel.app`;

  function handleCopy() {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-4 text-black animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b-3 border-black pb-3">
          <div className="flex items-center gap-3">
            <div className="bg-[#CCFF00] border-2 border-black p-2 text-black">
              <Share2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-black">SHARE SCORECARD</h2>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="bg-white border-2 border-black p-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-100"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Emoji Preview Box */}
        <div className="p-4 bg-slate-100 border-3 border-black font-mono text-xs leading-relaxed whitespace-pre-wrap text-black text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          {shareText}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleCopy}
            className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black uppercase text-sm border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-3 flex items-center justify-center gap-2 active:translate-x-0.5 active:translate-y-0.5"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-black" />
                <span>COPIED TO CLIPBOARD!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-black" />
                <span>COPY EMOJI SCORECARD</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
