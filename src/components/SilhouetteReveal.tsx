'use client';

import { useGameStore } from '@/store/useGameStore';
import { Eye, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function SilhouetteReveal() {
  const { guesses, gameStatus } = useGameStore();

  const isSolved = gameStatus === 'WON';
  const isFailed = gameStatus === 'LOST';

  // Calculate blur intensity based on guess count
  const attemptCount = guesses.length;
  let blurAmount = Math.max(0, 24 - attemptCount * 4);
  if (isSolved || isFailed) {
    blurAmount = 0;
  }

  // Get photo URL of last correct guess or fallback mystery silhouette
  const latestEvaluation = guesses[guesses.length - 1];
  const photoUrl = isSolved && latestEvaluation ? latestEvaluation.guessedPlayer.photoUrl : 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320/lsci/db/PICTURES/CMS/316600/316605.png';

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 md:p-5 backdrop-blur-md shadow-xl flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {/* Silhouette Image Container */}
        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden bg-slate-950 border border-emerald-500/30 flex-shrink-0 flex items-center justify-center shadow-lg">
          <motion.img
            src={photoUrl}
            alt="Mystery Silhouette"
            animate={{ filter: `blur(${blurAmount}px)` }}
            transition={{ duration: 0.5 }}
            className={`w-full h-full object-cover transition-all ${!isSolved && !isFailed ? 'brightness-50 contrast-125' : 'brightness-100'}`}
          />
          {!isSolved && !isFailed && (
            <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px] flex items-center justify-center">
              <Eye className="w-5 h-5 text-emerald-400/80 animate-pulse" />
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-100">Photo Silhouette Reveal</h3>
            {isSolved ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> Solved
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                Blur: {blurAmount}px
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isSolved ? 'Mystery player revealed!' : 'Silhouette sharpens automatically with every guess try.'}
          </p>
        </div>
      </div>
    </div>
  );
}
