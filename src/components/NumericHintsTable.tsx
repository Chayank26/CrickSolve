'use client';

import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';

export function NumericHintsTable() {
  const { guesses } = useGameStore();

  return (
    <div className="card-dark p-5 flex flex-col gap-4">
      {/* Card Header */}
      <div className="border-b border-white/10 pb-3">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          Numeric Hints
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">↑ means mystery is higher. ↓ means lower.</p>
      </div>

      {/* Table Container */}
      <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60">
        <table className="w-full text-center text-xs">
          <thead className="bg-slate-900/90 text-slate-300 font-extrabold uppercase text-[11px] border-b border-white/10">
            <tr>
              <th className="py-3 px-3 text-left">Guess</th>
              <th className="py-3 px-2">Birth Year</th>
              <th className="py-3 px-2">Tests</th>
              <th className="py-3 px-2">ODIs</th>
              <th className="py-3 px-2">T20Is</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-bold">
            {guesses.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-slate-500 font-semibold text-center">
                  No guesses yet. Submit a cricketer to view numeric stat hints!
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
                      className="hover:bg-white/5 transition-colors"
                    >
                      {/* Player Name */}
                      <td className="py-3 px-3 text-left font-extrabold text-white">
                        <div className="text-xs">{g.guessedPlayer.name}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{g.guessedPlayer.country}</div>
                      </td>

                      {/* Birth Year */}
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                          g.numericMatches.birthYear === 'match'
                            ? 'bg-emerald-500/20 text-emerald-400 font-extrabold border border-emerald-500/30'
                            : 'text-slate-200'
                        }`}>
                          {g.guessedPlayer.birthYear}
                          {g.numericMatches.birthYear === 'higher' && <span className="text-emerald-400 font-black">↑</span>}
                          {g.numericMatches.birthYear === 'lower' && <span className="text-rose-400 font-black">↓</span>}
                        </span>
                      </td>

                      {/* Tests */}
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                          g.numericMatches.tests === 'match'
                            ? 'bg-emerald-500/20 text-emerald-400 font-extrabold border border-emerald-500/30'
                            : 'text-slate-200'
                        }`}>
                          {g.guessedPlayer.tests}
                          {g.numericMatches.tests === 'higher' && <span className="text-emerald-400 font-black">↑</span>}
                          {g.numericMatches.tests === 'lower' && <span className="text-rose-400 font-black">↓</span>}
                        </span>
                      </td>

                      {/* ODIs */}
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                          g.numericMatches.odis === 'match'
                            ? 'bg-emerald-500/20 text-emerald-400 font-extrabold border border-emerald-500/30'
                            : 'text-slate-200'
                        }`}>
                          {g.guessedPlayer.odis}
                          {g.numericMatches.odis === 'higher' && <span className="text-emerald-400 font-black">↑</span>}
                          {g.numericMatches.odis === 'lower' && <span className="text-rose-400 font-black">↓</span>}
                        </span>
                      </td>

                      {/* T20Is */}
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                          g.numericMatches.t20is === 'match'
                            ? 'bg-emerald-500/20 text-emerald-400 font-extrabold border border-emerald-500/30'
                            : 'text-slate-200'
                        }`}>
                          {g.guessedPlayer.t20is}
                          {g.numericMatches.t20is === 'higher' && <span className="text-emerald-400 font-black">↑</span>}
                          {g.numericMatches.t20is === 'lower' && <span className="text-rose-400 font-black">↓</span>}
                        </span>
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
