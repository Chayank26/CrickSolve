'use client';

import { useGameStore } from '@/store/useGameStore';
import { Eye, CheckCircle2 } from 'lucide-react';
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
    <div className="w-full bg-white border-3 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-4 mt-2">
      <div className="flex items-center gap-4">
        {/* Silhouette Image Container */}
        <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-none overflow-hidden bg-slate-900 border-2 border-black flex-shrink-0 flex items-center justify-center">
          <motion.img
            src={photoUrl}
            alt="Mystery Silhouette"
            animate={{ filter: `blur(${blurAmount}px)` }}
            transition={{ duration: 0.5 }}
            className={`w-full h-full object-cover transition-all ${!isSolved && !isFailed ? 'brightness-50 contrast-125' : 'brightness-100'}`}
          />
          {!isSolved && !isFailed && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Eye className="w-5 h-5 text-[#CCFF00] animate-pulse" />
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black uppercase text-black">Photo Silhouette Reveal</h3>
            {isSolved ? (
              <span className="text-[10px] px-2.5 py-0.5 bg-[#CCFF00] text-black font-extrabold border-2 border-black uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Solved
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-black font-bold border-2 border-black uppercase">
                Blur: {blurAmount}px
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-slate-600 mt-0.5">
            {isSolved ? 'Mystery player revealed!' : 'Silhouette sharpens automatically with every guess try.'}
          </p>
        </div>
      </div>
    </div>
  );
}
