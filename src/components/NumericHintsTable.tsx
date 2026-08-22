'use client';

import { useGameStore } from '@/store/useGameStore';
import { ArrowUp, ArrowDown, Check, Hash } from 'lucide-react';
import { NumericComparison } from '@/types/game';

function Indicator({ status }: { status: NumericComparison }) {
  if (status === 'match') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/40">
        <Check className="w-3 h-3" /> Match
      </span>
    );
  }
  if (status === 'higher') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/40">
        <ArrowUp className="w-3 h-3 text-amber-400" /> Higher
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/40">
      <ArrowDown className="w-3 h-3 text-cyan-400" /> Lower
    </span>
  );
}

export function NumericHintsTable() {
  const { guesses } = useGameStore();

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 md:p-6 backdrop-blur-md shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>Numeric Stat Hints</span>
            <Hash className="w-4 h-4 text-cyan-400" />
          </h2>
          <p className="text-xs text-slate-400">↑ means mystery player is higher, ↓ means lower.</p>
        </div>
        <div className="text-xs text-slate-400 font-mono">{guesses.length} / 7 tries</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/70 uppercase text-[11px] font-semibold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Player</th>
              <th className="py-2.5 px-3">Birth Year</th>
              <th className="py-2.5 px-3">Tests</th>
              <th className="py-2.5 px-3">ODIs</th>
              <th className="py-2.5 px-3">T20Is</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {guesses.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 text-xs italic">
                  No guesses made yet. Enter a cricketer name above to start unlocking hints!
                </td>
              </tr>
            ) : (
              guesses.map((g, idx) => (
                <tr key={`${g.guessedPlayer.id}-${idx}`} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <img src={g.guessedPlayer.photoUrl} alt={g.guessedPlayer.name} className="w-7 h-7 rounded-full object-cover border border-slate-700" />
                      <div>
                        <div className="font-bold text-slate-200">{g.guessedPlayer.name}</div>
                        <div className="text-[10px] text-slate-400">{g.guessedPlayer.country}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-slate-200">{g.guessedPlayer.birthYear}</span>
                      <Indicator status={g.numericMatches.birthYear} />
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-slate-200">{g.guessedPlayer.tests}</span>
                      <Indicator status={g.numericMatches.tests} />
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-slate-200">{g.guessedPlayer.odis}</span>
                      <Indicator status={g.numericMatches.odis} />
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-slate-200">{g.guessedPlayer.t20is}</span>
                      <Indicator status={g.numericMatches.t20is} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
