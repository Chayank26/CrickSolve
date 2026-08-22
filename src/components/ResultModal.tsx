'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import confetti from 'canvas-confetti';
import { Trophy, Share2, RotateCcw, X, Sparkles, AlertCircle } from 'lucide-react';

export function ResultModal() {
  const { activeModal, setActiveModal, gameStatus, guesses, streak, gameMode, resetGame, currentDate } = useGameStore();
  const [nickname, setNickname] = useState('CricketFan');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isWon = gameStatus === 'WON';
  const isLost = gameStatus === 'LOST';

  useEffect(() => {
    if (activeModal === 'result' && isWon) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      submitScore();
    }
  }, [activeModal, isWon]);

  if (activeModal !== 'result' || (!isWon && !isLost)) return null;

  const targetPlayer = guesses.length > 0 ? guesses[guesses.length - 1].guessedPlayer : null;

  async function submitScore() {
    if (isSubmitted) return;
    try {
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: currentDate,
          userId: `user_${Math.floor(Math.random() * 100000)}`,
          nickname,
          attempts: guesses.length,
          timeMs: 12000,
        }),
      });
      setIsSubmitted(true);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-slate-200 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Banner Status */}
        <div className="flex flex-col items-center gap-2">
          {isWon ? (
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <Trophy className="w-6 h-6 animate-bounce" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
          )}
          <h2 className="text-xl font-extrabold text-slate-100">{isWon ? 'Spectacular Win! 🏆' : 'Game Over'}</h2>
          <p className="text-xs text-slate-400">
            {isWon ? `You identified the mystery cricketer in ${guesses.length} tries!` : 'You ran out of guess attempts for today.'}
          </p>
        </div>

        {/* Player Card reveal */}
        {targetPlayer && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-4 text-left">
            <img src={targetPlayer.photoUrl} alt={targetPlayer.name} className="w-14 h-14 rounded-xl object-cover border border-slate-700" />
            <div>
              <div className="text-base font-extrabold text-slate-100">{targetPlayer.name}</div>
              <div className="text-xs text-emerald-400 font-medium">
                {targetPlayer.country} • {targetPlayer.role}
              </div>
              {targetPlayer.signaturePerformance && (
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">
                  "{targetPlayer.signaturePerformance}"
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => setActiveModal('share')}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Score</span>
          </button>

          {gameMode === 'unlimited' ? (
            <button
              onClick={() => {
                resetGame();
                setActiveModal(null);
              }}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              <span>Next Player</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveModal(null)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all"
            >
              <X className="w-4 h-4 text-slate-400" />
              <span>Close</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
