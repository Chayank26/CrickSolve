'use client';

import { useGameStore } from '@/store/useGameStore';
import { Lightbulb, Lock, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function GuessesGrid() {
  const { guesses, unlockedHint, unlockHintManually } = useGameStore();

  const isHintAvailable = guesses.length >= 4 && !unlockedHint;

  return (
    <div className="w-full flex flex-col gap-6 my-2">
      {/* Guesses Table Container */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[720px] flex flex-col gap-3">
          {/* Column Header Titles */}
          <div className="grid grid-cols-12 gap-2 text-center text-xs font-black uppercase text-slate-600 px-1">
            <div className="col-span-3 text-left pl-3" />
            <div className="col-span-1">COUNTRY</div>
            <div className="col-span-1">ROLE</div>
            <div className="col-span-1">BATTING</div>
            <div className="col-span-2">BIRTH</div>
            <div className="col-span-1">TESTS</div>
            <div className="col-span-1">ODIS</div>
            <div className="col-span-2">IPL TEAM</div>
          </div>

          {/* Render Guesses Rows */}
          {guesses.length === 0 ? (
            <div className="bg-white border-3 border-black p-8 text-center text-sm font-bold text-slate-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              No guesses submitted yet. Type a cricketer name above to start unlocking attributes!
            </div>
          ) : (
            <AnimatePresence>
              {guesses.map((g, idx) => {
                const countryCode = g.guessedPlayer.country.slice(0, 3).toUpperCase();
                const roleCode = g.guessedPlayer.role.includes('Wicketkeeper')
                  ? 'WK'
                  : g.guessedPlayer.role.includes('All-rounder')
                  ? 'AR'
                  : g.guessedPlayer.role.includes('Bowler')
                  ? 'BOWL'
                  : 'BAT';
                const battingCode = g.guessedPlayer.battingHand.includes('Left') ? 'LEFT' : 'RIGHT';
                const iplCode = g.guessedPlayer.iplTeam === 'None' ? 'N/A' : g.guessedPlayer.iplTeam.split(' ').map((w) => w[0]).join('');

                return (
                  <motion.div
                    key={`${g.guessedPlayer.id}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-12 gap-2 items-stretch"
                  >
                    {/* Player Name Column (Black Box) */}
                    <div className="col-span-3 bg-black text-white border-3 border-black p-2.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center">
                      <span className="text-[10px] font-black text-[#CCFF00] uppercase tracking-wider">
                        GUESS {idx + 1}
                      </span>
                      <span className="text-sm font-black uppercase truncate text-white">
                        {g.guessedPlayer.name}
                      </span>
                    </div>

                    {/* Country Tile */}
                    <div
                      className={`col-span-1 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center font-black text-xs p-1 transition-all ${
                        g.attributeMatches.country ? 'bg-[#CCFF00] text-black' : 'bg-[#CBD5E1] text-slate-500'
                      }`}
                    >
                      {countryCode}
                    </div>

                    {/* Role Tile */}
                    <div
                      className={`col-span-1 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center font-black text-xs p-1 transition-all ${
                        g.attributeMatches.role ? 'bg-[#CCFF00] text-black' : 'bg-[#CBD5E1] text-slate-500'
                      }`}
                    >
                      {roleCode}
                    </div>

                    {/* Batting Hand Tile */}
                    <div
                      className={`col-span-1 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center font-black text-[11px] p-1 transition-all ${
                        g.attributeMatches.battingHand ? 'bg-[#CCFF00] text-black' : 'bg-[#CBD5E1] text-slate-500'
                      }`}
                    >
                      {battingCode}
                    </div>

                    {/* Birth Year Tile */}
                    <div
                      className={`col-span-2 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center font-black text-xs p-1.5 transition-all ${
                        g.numericMatches.birthYear === 'match'
                          ? 'bg-[#CCFF00] text-black'
                          : 'bg-white text-black'
                      }`}
                    >
                      <span>{g.guessedPlayer.birthYear}</span>
                      {g.numericMatches.birthYear === 'higher' && <span className="text-xs">↑</span>}
                      {g.numericMatches.birthYear === 'lower' && <span className="text-xs">↓</span>}
                    </div>

                    {/* Tests Tile */}
                    <div
                      className={`col-span-1 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center font-black text-xs p-1 transition-all ${
                        g.numericMatches.tests === 'match'
                          ? 'bg-[#CCFF00] text-black'
                          : 'bg-white text-black'
                      }`}
                    >
                      <span>{g.guessedPlayer.tests}</span>
                      {g.numericMatches.tests === 'higher' && <span className="text-xs">↑</span>}
                      {g.numericMatches.tests === 'lower' && <span className="text-xs">↓</span>}
                    </div>

                    {/* ODIs Tile */}
                    <div
                      className={`col-span-1 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center font-black text-xs p-1 transition-all ${
                        g.numericMatches.odis === 'match'
                          ? 'bg-[#CCFF00] text-black'
                          : 'bg-white text-black'
                      }`}
                    >
                      <span>{g.guessedPlayer.odis}</span>
                      {g.numericMatches.odis === 'higher' && <span className="text-xs">↑</span>}
                      {g.numericMatches.odis === 'lower' && <span className="text-xs">↓</span>}
                    </div>

                    {/* IPL Team Tile */}
                    <div
                      className={`col-span-2 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center font-black text-xs p-1 transition-all ${
                        g.attributeMatches.iplTeam
                          ? 'bg-[#FF5500] text-white'
                          : 'bg-[#CBD5E1] text-slate-500'
                      }`}
                    >
                      {iplCode}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Bottom Unlock Hint Bar */}
      <div className="w-full flex items-center justify-center mt-2">
        <button
          onClick={unlockHintManually}
          disabled={!isHintAvailable && !unlockedHint}
          className="w-full max-w-lg bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3 flex items-center justify-center gap-3 transition-all hover:bg-slate-50 active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-80"
        >
          <span className="font-black text-xs uppercase tracking-wider text-black">
            UNLOCK HINT
          </span>

          {unlockedHint ? (
            <span className="bg-[#CCFF00] text-black font-extrabold text-[11px] px-3 py-1 border-2 border-black uppercase">
              {unlockedHint}
            </span>
          ) : isHintAvailable ? (
            <span className="bg-[#CCFF00] text-black font-extrabold text-[11px] px-3 py-1 border-2 border-black uppercase animate-pulse">
              HINT READY (CLICK)
            </span>
          ) : (
            <span className="bg-slate-300 text-slate-700 font-extrabold text-[11px] px-3 py-1 border-2 border-black uppercase">
              LOCKED
            </span>
          )}

          <span className="text-[11px] font-semibold text-slate-500 uppercase">
            Available after 4 guesses
          </span>
        </button>
      </div>
    </div>
  );
}
