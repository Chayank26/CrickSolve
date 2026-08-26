'use client';

import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';

export function NumericHintsTable() {
  const { guesses } = useGameStore();

  return (
    <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 flex flex-col gap-4 text-black">
      {/* Card Header */}
      <div className="border-b-3 border-black pb-3">
        <h2 className="text-xl font-black uppercase tracking-tight text-black">
          NUMERIC HINTS
        </h2>
        <p className="text-xs font-bold text-slate-600 mt-0.5">↑ means mystery is higher. ↓ means lower.</p>
      </div>

      {/* Neubrutalist Table Wrap */}
      <div className="w-full overflow-x-auto border-3 border-black bg-slate-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <table className="w-full text-center text-xs">
          <thead className="bg-black text-white font-black uppercase text-xs border-b-3 border-black">
            <tr>
              <th className="py-2.5 px-3 text-left pl-3">GUESS</th>
              <th className="py-2.5 px-2">BIRTH</th>
              <th className="py-2.5 px-2">TESTS</th>
              <th className="py-2.5 px-2">ODIS</th>
              <th className="py-2.5 px-2">T20IS</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black font-black">
            {guesses.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-slate-500 font-bold text-xs uppercase text-center">
                  No guesses submitted yet. Type a cricketer name to start comparing stats!
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {guesses.map((g, idx) => {
                  return (
                    <motion.tr
                      key={`${g.guessedPlayer.id}-${idx}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="hover:bg-slate-100 transition-colors"
                    >
                      {/* Player Name Box */}
                      <td className="py-2.5 px-3 text-left bg-black text-white border-r-3 border-black">
                        <div className="text-[10px] text-[#CCFF00] uppercase font-black">GUESS {idx + 1}</div>
                        <div className="text-xs font-black uppercase text-white truncate">{g.guessedPlayer.name}</div>
                      </td>

                      {/* Birth Year */}
                      <td className={`py-2.5 px-2 border-r-2 border-black ${
                        g.numericMatches.birthYear === 'match' ? 'bg-[#CCFF00] text-black' : 'bg-white text-black'
                      }`}>
                        <div className="flex items-center justify-center gap-1 font-black">
                          <span>{g.guessedPlayer.birthYear}</span>
                          {g.numericMatches.birthYear === 'higher' && <span className="text-xs">↑</span>}
                          {g.numericMatches.birthYear === 'lower' && <span className="text-xs">↓</span>}
                        </div>
                      </td>

                      {/* Tests */}
                      <td className={`py-2.5 px-2 border-r-2 border-black ${
                        g.numericMatches.tests === 'match' ? 'bg-[#CCFF00] text-black' : 'bg-white text-black'
                      }`}>
                        <div className="flex items-center justify-center gap-1 font-black">
                          <span>{g.guessedPlayer.tests}</span>
                          {g.numericMatches.tests === 'higher' && <span className="text-xs">↑</span>}
                          {g.numericMatches.tests === 'lower' && <span className="text-xs">↓</span>}
                        </div>
                      </td>

                      {/* ODIs */}
                      <td className={`py-2.5 px-2 border-r-2 border-black ${
                        g.numericMatches.odis === 'match' ? 'bg-[#CCFF00] text-black' : 'bg-white text-black'
                      }`}>
                        <div className="flex items-center justify-center gap-1 font-black">
                          <span>{g.guessedPlayer.odis}</span>
                          {g.numericMatches.odis === 'higher' && <span className="text-xs">↑</span>}
                          {g.numericMatches.odis === 'lower' && <span className="text-xs">↓</span>}
                        </div>
                      </td>

                      {/* T20Is */}
                      <td className={`py-2.5 px-2 ${
                        g.numericMatches.t20is === 'match' ? 'bg-[#CCFF00] text-black' : 'bg-white text-black'
                      }`}>
                        <div className="flex items-center justify-center gap-1 font-black">
                          <span>{g.guessedPlayer.t20is}</span>
                          {g.numericMatches.t20is === 'higher' && <span className="text-xs">↑</span>}
                          {g.numericMatches.t20is === 'lower' && <span className="text-xs">↓</span>}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
