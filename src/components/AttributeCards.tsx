'use client';

import { useGameStore } from '@/store/useGameStore';
import { Lock, Sparkles, Eye, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function AttributeCards() {
  const { guesses, gameStatus } = useGameStore();

  const isSolved = gameStatus === 'WON';
  const isFailed = gameStatus === 'LOST';

  const lastGuess = guesses.length > 0 ? guesses[guesses.length - 1] : null;

  // Track matched attributes across all guesses submitted
  const matchedCountry = guesses.some((g) => g.attributeMatches.country);
  const matchedBatting = guesses.some((g) => g.attributeMatches.battingHand);
  const matchedBowling = guesses.some((g) => g.attributeMatches.bowlingType);
  const matchedRole = guesses.some((g) => g.attributeMatches.role);
  const matchedIpl = guesses.some((g) => g.attributeMatches.iplTeam);
  const matchedRetired = guesses.some((g) => g.attributeMatches.retired);

  const player = lastGuess?.guessedPlayer;

  const attributes = [
    {
      key: 'country',
      label: 'COUNTRY',
      matched: matchedCountry,
      value: player?.country || '???',
    },
    {
      key: 'battingHand',
      label: 'BATTING HAND',
      matched: matchedBatting,
      value: player?.battingHand || '???',
    },
    {
      key: 'bowlingType',
      label: 'BOWLING STYLE',
      matched: matchedBowling,
      value: player?.bowlingType || '???',
    },
    {
      key: 'role',
      label: 'ROLE',
      matched: matchedRole,
      value: player?.role || '???',
    },
    {
      key: 'iplTeam',
      label: 'IPL TEAM',
      matched: matchedIpl,
      value: player?.iplTeam || '???',
    },
    {
      key: 'retired',
      label: 'RETIRED',
      matched: matchedRetired,
      value: player ? (player.retired ? 'YES' : 'NO') : '???',
    },
  ];

  // Silhouette blur calculation
  const attemptCount = guesses.length;
  let blurAmount = Math.max(0, 24 - attemptCount * 4);
  if (isSolved || isFailed) blurAmount = 0;

  const photoUrl = isSolved && lastGuess ? lastGuess.guessedPlayer.photoUrl : 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320/lsci/db/PICTURES/CMS/316600/316605.png';

  return (
    <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 flex flex-col gap-4 text-black">
      {/* Card Header */}
      <div className="border-b-3 border-black pb-3">
        <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center justify-between">
          MYSTERY PLAYER
        </h2>
        <p className="text-xs font-bold text-slate-600 mt-0.5">Attributes unlock when your guess matches.</p>
      </div>

      {/* 6 Unlockable Attribute Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {attributes.map((attr, idx) => {
          return (
            <motion.div
              key={attr.key}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-3.5 border-3 border-black flex flex-col justify-center transition-all min-h-[68px] ${
                attr.matched
                  ? 'bg-[#CCFF00] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ring-2 ring-black font-black'
                  : 'bg-slate-100 text-slate-700 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-black">{attr.label}</span>
                {attr.matched ? (
                  <Sparkles className="w-4 h-4 text-black" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-black" />
                )}
              </div>
              <div className="text-xs md:text-sm font-black uppercase mt-1 truncate">
                {attr.matched ? attr.value : 'LOCKED'}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progressive Photo Silhouette Card Underneath */}
      <div className="bg-[#7E22CE] text-white border-3 border-black p-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-3 mt-1">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-none border-2 border-black overflow-hidden bg-slate-200 flex-shrink-0 flex items-center justify-center">
            <motion.img
              src={photoUrl}
              alt="Silhouette"
              animate={{ filter: `blur(${blurAmount}px)` }}
              transition={{ duration: 0.4 }}
              className={`w-full h-full object-cover ${!isSolved && !isFailed ? 'brightness-50 contrast-125' : 'brightness-100'}`}
            />
            {!isSolved && !isFailed && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Eye className="w-4 h-4 text-[#CCFF00]" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-[#CCFF00]">SILHOUETTE UNBLUR</span>
              {isSolved ? (
                <span className="text-[10px] px-2 py-0.5 bg-[#CCFF00] text-black border border-black font-black uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> SOLVED
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 bg-black text-[#CCFF00] font-black border border-black uppercase">
                  BLUR: {blurAmount}PX
                </span>
              )}
            </div>
            <p className="text-[11px] font-semibold text-white/90 mt-0.5">
              {isSolved ? 'Mystery player revealed!' : 'Silhouette sharpens with every guess.'}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Hint Note */}
      <p className="text-xs font-bold text-slate-500 text-center border-t-2 border-black pt-2.5 mt-1 uppercase">
        Hint unlock available after 4 guesses.
      </p>
    </div>
  );
}
