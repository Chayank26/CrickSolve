'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { X, Share2, Copy, Check, Sparkles } from 'lucide-react';

export function ShareGridModal() {
  const { activeModal, setActiveModal, guesses, gameStatus, streak, currentDate } = useGameStore();
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100">Share Scorecard</h2>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Emoji Preview Box */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center font-mono text-sm leading-relaxed whitespace-pre-wrap text-slate-300">
          {shareText}
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Emoji Scorecard</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
