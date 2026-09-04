'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { getDailyTargetPlayer } from '@/lib/game-engine';
import { PLAYERS } from '@/data/players';
import { Lock, Sparkles, Eye, CheckCircle2, Lightbulb, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AttributeCards() {
  const {
    guesses,
    gameStatus,
    currentDate,
    category,
    gameMode,
    unlimitedTargetId,
    isHintSelecting,
    cancelHintSelection,
    manuallyUnlockedAttributes,
    unlockAttributeByHint,
  } = useGameStore();

  const [flippingAttrKey, setFlippingAttrKey] = useState<string | null>(null);

  // Resolve target player for daily/unlimited mode
  let targetPlayer = getDailyTargetPlayer(currentDate, category);
  if (gameMode === 'unlimited' && unlimitedTargetId) {
    const found = PLAYERS.find((p) => p.id === unlimitedTargetId);
    if (found) targetPlayer = found;
  }

  const isSolved = gameStatus === 'WON';
  const isFailed = gameStatus === 'LOST';

  // Check which attributes have been matched by guesses submitted
  const matchedCountry = guesses.some((g) => g.attributeMatches.country);
  const matchedBatting = guesses.some((g) => g.attributeMatches.battingHand);
  const matchedBowling = guesses.some((g) => g.attributeMatches.bowlingType);
  const matchedRole = guesses.some((g) => g.attributeMatches.role);
  const matchedIpl = guesses.some((g) => g.attributeMatches.iplTeam);
  const matchedRetired = guesses.some((g) => g.attributeMatches.retired);

  const attributes = [
    {
      key: 'country',
      label: 'COUNTRY',
      matched: matchedCountry || !!manuallyUnlockedAttributes.country,
      value: targetPlayer.country,
    },
    {
      key: 'battingHand',
      label: 'BATTING HAND',
      matched: matchedBatting || !!manuallyUnlockedAttributes.battingHand,
      value: targetPlayer.battingHand,
    },
    {
      key: 'bowlingType',
      label: 'BOWLING STYLE',
      matched: matchedBowling || !!manuallyUnlockedAttributes.bowlingType,
      value: targetPlayer.bowlingType,
    },
    {
      key: 'role',
      label: 'ROLE',
      matched: matchedRole || !!manuallyUnlockedAttributes.role,
      value: targetPlayer.role,
    },
    {
      key: 'iplTeam',
      label: 'IPL TEAM',
      matched: matchedIpl || !!manuallyUnlockedAttributes.iplTeam,
      value: targetPlayer.iplTeam === 'None' ? 'NOT IN IPL' : targetPlayer.iplTeam,
    },
    {
      key: 'retired',
      label: 'RETIRED',
      matched: matchedRetired || !!manuallyUnlockedAttributes.retired,
      value: targetPlayer.retired ? 'YES' : 'NO',
    },
  ];

  // Silhouette blur calculation
  const attemptCount = guesses.length;
  let blurAmount = Math.max(0, 24 - attemptCount * 4);
  if (isSolved || isFailed) blurAmount = 0;

  const photoUrl = targetPlayer.photoUrl || 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320/lsci/db/PICTURES/CMS/316600/316605.png';

  const handleCardClick = (key: string, label: string, value: string, isMatched: boolean) => {
    if (!isHintSelecting || isMatched) return;

    setFlippingAttrKey(key);
    setTimeout(() => {
      unlockAttributeByHint(key, label, value);
      setFlippingAttrKey(null);
    }, 300);
  };

  return (
    <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 flex flex-col gap-4 text-black relative">
      {/* Card Header */}
      <div className="border-b-3 border-black pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            MYSTERY PLAYER
          </h2>
          <p className="text-xs font-bold text-slate-600 mt-0.5">Attributes unlock when your guess matches.</p>
        </div>

        {/* Cancel Hint Selection Mode Button */}
        {isHintSelecting && (
          <button
            onClick={cancelHintSelection}
            className="bg-black text-white hover:bg-slate-900 border-2 border-black px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> CANCEL HINT
          </button>
        )}
      </div>

      {/* Active Hint Selection Banner */}
      <AnimatePresence>
        {isHintSelecting && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#CCFF00] border-3 border-black p-3 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce"
          >
            <div className="text-xs font-black uppercase text-black flex items-center justify-center gap-2">
              <Lightbulb className="w-4 h-4 fill-black" />
              <span>HINT ACTIVE! CLICK ANY SHINING LOCKED ATTRIBUTE BELOW TO UNLOCK IT!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6 Unlockable Attribute Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {attributes.map((attr, idx) => {
          const isTargetingHint = isHintSelecting && !attr.matched;
          const isFlippingThis = flippingAttrKey === attr.key;

          return (
            <motion.div
              key={attr.key}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{
                scale: isFlippingThis ? [1, 1.12, 1] : 1,
                rotateY: isFlippingThis ? [0, 90, 0] : 0,
                opacity: 1,
              }}
              transition={{ delay: idx * 0.04, duration: 0.3 }}
              onClick={() => handleCardClick(attr.key, attr.label, attr.value, attr.matched)}
              className={`relative overflow-hidden p-3.5 border-3 border-black flex flex-col justify-center transition-all min-h-[68px] ${
                attr.matched
                  ? 'bg-[#CCFF00] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ring-2 ring-black font-black'
                  : isTargetingHint
                  ? 'bg-[#7E22CE] text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] cursor-pointer ring-4 ring-[#CCFF00] animate-pulse'
                  : 'bg-slate-100 text-slate-700 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold'
              }`}
            >
              {/* Animated Glare / Shimmer Sweep Overlay for Hint Selection */}
              {isTargetingHint && (
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
                />
              )}

              <div className="flex items-center justify-between relative z-10">
                <span className={`text-[10px] font-black uppercase ${isTargetingHint ? 'text-[#CCFF00]' : 'text-black'}`}>
                  {attr.label}
                </span>
                {attr.matched ? (
                  <Sparkles className="w-4 h-4 text-black" />
                ) : isTargetingHint ? (
                  <Lightbulb className="w-4 h-4 text-[#CCFF00] animate-spin" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-black" />
                )}
              </div>

              <div className={`text-xs md:text-sm font-black uppercase mt-1 truncate relative z-10 ${
                isTargetingHint ? 'text-white' : ''
              }`}>
                {attr.matched ? attr.value : isTargetingHint ? 'CLICK TO UNLOCK' : 'LOCKED'}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progressive Photo Silhouette Card Underneath */}
      <div className="bg-[#7E22CE] text-white border-3 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center gap-3 mt-1">
        {/* Header with Title & Blur/Pixels Badge */}
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

        {/* Big Center-Aligned Silhouette Image */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-none border-4 border-black overflow-hidden bg-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center group my-1">
          <motion.img
            src={photoUrl}
            alt="Mystery Cricketer Silhouette"
            animate={{ filter: `blur(${blurAmount}px)` }}
            transition={{ duration: 0.4 }}
            className={`w-full h-full object-cover transition-all ${
              !isSolved && !isFailed
                ? 'brightness-50 contrast-150 scale-105'
                : 'brightness-100 scale-100'
            }`}
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

      {/* Bottom Hint Note */}
      <p className="text-xs font-bold text-slate-500 text-center border-t-2 border-black pt-2.5 mt-1 uppercase">
        Hint unlock available after 4 guesses.
      </p>
    </div>
  );
}
