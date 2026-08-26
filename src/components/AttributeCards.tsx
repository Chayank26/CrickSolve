'use client';

import { useGameStore } from '@/store/useGameStore';
import { Lock, Sparkles, Eye, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function AttributeCards() {
  const { guesses, gameStatus } = useGameStore();

  const isSolved = gameStatus === 'WON';
  const isFailed = gameStatus === 'LOST';

  // Find latest guess or matches
  const lastGuess = guesses.length > 0 ? guesses[guesses.length - 1] : null;

  // Track matched attributes across all guesses submitted
  const matchedCountry = guesses.some((g) => g.attributeMatches.country);
  const matchedBatting = guesses.some((g) => g.attributeMatches.battingHand);
  const matchedBowling = guesses.some((g) => g.attributeMatches.bowlingType);
  const matchedRole = guesses.some((g) => g.attributeMatches.role);
  const matchedIpl = guesses.some((g) => g.attributeMatches.iplTeam);
  const matchedRetired = guesses.some((g) => g.attributeMatches.retired);

  // Target player values from last guess or target fallback
  const player = lastGuess?.guessedPlayer;

  const attributes = [
    {
      key: 'country',
      label: 'Country',
      matched: matchedCountry,
      value: player?.country || '???',
    },
    {
      key: 'battingHand',
      label: 'Batting Hand',
      matched: matchedBatting,
      value: player?.battingHand || '???',
    },
    {
      key: 'bowlingType',
      label: 'Bowling Style',
      matched: matchedBowling,
      value: player?.bowlingType || '???',
    },
    {
      key: 'role',
      label: 'Role',
      matched: matchedRole,
      value: player?.role || '???',
    },
    {
      key: 'iplTeam',
      label: 'IPL Team',
      matched: matchedIpl,
      value: player?.iplTeam || '???',
    },
    {
      key: 'retired',
      label: 'Retired',
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
    <div className="card-dark p-5 flex flex-col gap-4">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            Mystery Player
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Attributes unlock when your guess matches.</p>
        </div>
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
              className={`relative overflow-hidden p-3.5 rounded-2xl border transition-all min-h-[64px] flex flex-col justify-center ${
                attr.matched
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-500/10'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase opacity-75">{attr.label}</span>
                {attr.matched ? (
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                )}
              </div>
              <div className="text-xs md:text-sm font-extrabold mt-1 truncate">
                {attr.matched ? attr.value : '🔒 Locked'}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Photo Silhouette Card Underneath */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-3 mt-1">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-white/15 flex-shrink-0 flex items-center justify-center">
            <motion.img
              src={photoUrl}
              alt="Silhouette"
              animate={{ filter: `blur(${blurAmount}px)` }}
              transition={{ duration: 0.4 }}
              className={`w-full h-full object-cover ${!isSolved && !isFailed ? 'brightness-50 contrast-125' : 'brightness-100'}`}
            />
            {!isSolved && !isFailed && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Eye className="w-4 h-4 text-emerald-400 animate-pulse" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-white">Silhouette Reveal</span>
              {isSolved ? (
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Solved
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full font-bold">
                  Blur: {blurAmount}px
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isSolved ? 'Mystery player revealed!' : 'Silhouette sharpens with every guess.'}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Hint Note */}
      <p className="text-xs text-slate-400 text-center border-t border-white/10 pt-2.5 mt-1">
        Hint unlock available after 4 guesses.
      </p>
    </div>
  );
}
