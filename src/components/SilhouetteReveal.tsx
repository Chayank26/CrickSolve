'use client';

import { useGameStore } from '@/store/useGameStore';
import { getDailyTargetPlayer } from '@/lib/game-engine';
import { PLAYERS } from '@/data/players';
import { Eye, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function SilhouetteReveal() {
  const { guesses, gameStatus, currentDate, category, gameMode, unlimitedTargetId } = useGameStore();

  const isSolved = gameStatus === 'WON';
  const isFailed = gameStatus === 'LOST';

  // Resolve target player for daily/unlimited mode
  let targetPlayer = getDailyTargetPlayer(currentDate, category);
  if (gameMode === 'unlimited' && unlimitedTargetId) {
    const found = PLAYERS.find((p) => p.id === unlimitedTargetId);
    if (found) targetPlayer = found;
  }

  // Calculate blur intensity based on guess count
  const attemptCount = guesses.length;
  let blurAmount = Math.max(0, 24 - attemptCount * 4);
  if (isSolved || isFailed) {
    blurAmount = 0;
  }

  const photoUrl = targetPlayer.photoUrl || 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320/lsci/db/PICTURES/CMS/316600/316605.png';

  return (
    <div className="w-full bg-[#7E22CE] text-white border-3 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center gap-3 mt-2">
      <div className="flex flex-col items-center gap-1.5 w-full">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-xs md:text-sm font-black uppercase text-[#CCFF00] tracking-wide flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-[#CCFF00]" /> SILHOUETTE UNBLUR
          </span>
          {isSolved ? (
            <span className="text-[10px] md:text-xs px-2.5 py-0.5 bg-[#CCFF00] text-black border-2 border-black font-black uppercase flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-black" /> SOLVED
            </span>
          ) : (
            <span className="text-[10px] md:text-xs px-2.5 py-0.5 bg-black text-[#CCFF00] font-black border-2 border-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              PIXELS / BLUR: {blurAmount}PX
            </span>
          )}
        </div>
        <p className="text-[11px] md:text-xs font-bold text-white/90">
          {isSolved ? 'Mystery cricketer identity revealed!' : 'Silhouette automatically sharpens with every guess try.'}
        </p>
      </div>

      {/* Silhouette Image Container */}
      <div className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-none border-4 border-black overflow-hidden bg-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center group my-1">
        <motion.img
          src={photoUrl}
          alt="Mystery Silhouette"
          animate={{ filter: `blur(${blurAmount}px)` }}
          transition={{ duration: 0.5 }}
          className={`w-full h-full object-cover transition-all ${!isSolved && !isFailed ? 'brightness-50 contrast-150 scale-105' : 'brightness-100 scale-100'}`}
        />
        {!isSolved && !isFailed && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
            <div className="bg-black/80 border-2 border-[#CCFF00] p-2 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Eye className="w-6 h-6 text-[#CCFF00] animate-pulse" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
