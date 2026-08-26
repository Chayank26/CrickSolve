'use client';

import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';

interface FlipTileProps {
  delay: number;
  colSpan: string;
  isMatched: boolean;
  isIpl?: boolean;
  isNumeric?: boolean;
  children: React.ReactNode;
}

function FlipTile({ delay, colSpan, isMatched, isIpl = false, isNumeric = false, children }: FlipTileProps) {
  let bgColorClass = 'bg-[#CBD5E1] text-slate-500 border-2 border-black';

  if (isMatched) {
    bgColorClass = isIpl
      ? 'bg-[#FF5500] text-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ring-2 ring-black'
      : 'bg-[#CCFF00] text-black border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ring-2 ring-black';
  } else if (isNumeric) {
    bgColorClass = 'bg-white text-black border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]';
  } else {
    bgColorClass = 'bg-[#CBD5E1] text-slate-500 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]';
  }

  return (
    <motion.div
      initial={{ rotateY: 90, scale: 0.7, opacity: 0 }}
      animate={{
        rotateY: 0,
        scale: isMatched ? [0.7, 1.18, 1] : [0.7, 1.05, 1],
        opacity: 1,
      }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.23, 1, 0.32, 1],
      }}
      style={{ transformStyle: 'preserve-3d' }}
      className={`${colSpan} flex flex-col items-center justify-center font-black text-xs p-1 transition-all ${bgColorClass}`}
    >
      {children}
    </motion.div>
  );
}

export function GuessesGrid() {
  const { guesses, unlockedHint } = useGameStore();

  const isHintAvailable = guesses.length >= 4 && !unlockedHint;

  return (
    <div className="w-full flex flex-col gap-6 my-2">
      {/* Guesses Table Container */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[840px] flex flex-col gap-3">
          {/* Column Header Titles */}
          <div className="grid grid-cols-12 gap-2 text-center text-[11px] font-black uppercase text-slate-600 px-1">
            <div className="col-span-3 text-left pl-3" />
            <div className="col-span-1">COUNTRY</div>
            <div className="col-span-1">ROLE</div>
            <div className="col-span-1">BATTING</div>
            <div className="col-span-1">BIRTH</div>
            <div className="col-span-1">TESTS</div>
            <div className="col-span-1">ODIS</div>
            <div className="col-span-1">T20IS</div>
            <div className="col-span-1">IPL TEAM</div>
            <div className="col-span-1">RETIRED?</div>
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
                const retiredCode = g.guessedPlayer.retired ? 'YES' : 'NO';

                return (
                  <motion.div
                    key={`${g.guessedPlayer.id}-${idx}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-12 gap-2 items-stretch perspective-1000"
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

                    {/* Tile 1: Country */}
                    <FlipTile delay={0.08} colSpan="col-span-1" isMatched={g.attributeMatches.country}>
                      <span>{countryCode}</span>
                    </FlipTile>

                    {/* Tile 2: Role */}
                    <FlipTile delay={0.16} colSpan="col-span-1" isMatched={g.attributeMatches.role}>
                      <span>{roleCode}</span>
                    </FlipTile>

                    {/* Tile 3: Batting Hand */}
                    <FlipTile delay={0.24} colSpan="col-span-1" isMatched={g.attributeMatches.battingHand}>
                      <span className="text-[11px]">{battingCode}</span>
                    </FlipTile>

                    {/* Tile 4: Birth Year */}
                    <FlipTile
                      delay={0.32}
                      colSpan="col-span-1"
                      isMatched={g.numericMatches.birthYear === 'match'}
                      isNumeric={g.numericMatches.birthYear !== 'match'}
                    >
                      <span>{g.guessedPlayer.birthYear}</span>
                      {g.numericMatches.birthYear === 'higher' && <span className="text-xs">↑</span>}
                      {g.numericMatches.birthYear === 'lower' && <span className="text-xs">↓</span>}
                    </FlipTile>

                    {/* Tile 5: Tests */}
                    <FlipTile
                      delay={0.4}
                      colSpan="col-span-1"
                      isMatched={g.numericMatches.tests === 'match'}
                      isNumeric={g.numericMatches.tests !== 'match'}
                    >
                      <span>{g.guessedPlayer.tests}</span>
                      {g.numericMatches.tests === 'higher' && <span className="text-xs">↑</span>}
                      {g.numericMatches.tests === 'lower' && <span className="text-xs">↓</span>}
                    </FlipTile>

                    {/* Tile 6: ODIs */}
                    <FlipTile
                      delay={0.48}
                      colSpan="col-span-1"
                      isMatched={g.numericMatches.odis === 'match'}
                      isNumeric={g.numericMatches.odis !== 'match'}
                    >
                      <span>{g.guessedPlayer.odis}</span>
                      {g.numericMatches.odis === 'higher' && <span className="text-xs">↑</span>}
                      {g.numericMatches.odis === 'lower' && <span className="text-xs">↓</span>}
                    </FlipTile>

                    {/* Tile 7: T20Is (Brought back!) */}
                    <FlipTile
                      delay={0.56}
                      colSpan="col-span-1"
                      isMatched={g.numericMatches.t20is === 'match'}
                      isNumeric={g.numericMatches.t20is !== 'match'}
                    >
                      <span>{g.guessedPlayer.t20is}</span>
                      {g.numericMatches.t20is === 'higher' && <span className="text-xs">↑</span>}
                      {g.numericMatches.t20is === 'lower' && <span className="text-xs">↓</span>}
                    </FlipTile>

                    {/* Tile 8: IPL Team */}
                    <FlipTile delay={0.64} colSpan="col-span-1" isMatched={g.attributeMatches.iplTeam} isIpl={true}>
                      <span>{iplCode}</span>
                    </FlipTile>

                    {/* Tile 9: Retired Status */}
                    <FlipTile delay={0.72} colSpan="col-span-1" isMatched={g.attributeMatches.retired}>
                      <span>{retiredCode}</span>
                    </FlipTile>
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
          onClick={() => {
            if (isHintAvailable && !unlockedHint) {
              useGameStore.getState().setActiveModal('hintPicker');
            }
          }}
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
              HINT READY (CHOOSE ATTRIBUTE)
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
