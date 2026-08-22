'use client';

import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle2, Sparkles } from 'lucide-react';

interface AttributeConfig {
  key: 'country' | 'battingHand' | 'bowlingType' | 'role' | 'iplTeam' | 'retired';
  label: string;
}

const ATTRIBUTES: AttributeConfig[] = [
  { key: 'country', label: 'Country' },
  { key: 'battingHand', label: 'Batting Hand' },
  { key: 'bowlingType', label: 'Bowling Type' },
  { key: 'role', label: 'Role' },
  { key: 'iplTeam', label: 'IPL Team' },
  { key: 'retired', label: 'Retired' },
];

export function AttributeCards() {
  const { guesses, gameStatus } = useGameStore();

  // Determine unlocked attribute values from all previous correct attribute matches
  const unlockedAttributes = ATTRIBUTES.reduce<Record<string, string>>((acc, attr) => {
    for (let i = guesses.length - 1; i >= 0; i--) {
      const g = guesses[i];
      if (g.attributeMatches[attr.key]) {
        let val = String(g.guessedPlayer[attr.key]);
        if (attr.key === 'retired') {
          val = g.guessedPlayer.retired ? 'Yes (Retired)' : 'No (Active)';
        }
        acc[attr.key] = val;
        break;
      }
    }
    return acc;
  }, {});

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 md:p-6 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>Mystery Player Attributes</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </h2>
          <p className="text-xs text-slate-400">Attributes shatter & unlock when your guess matches.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
        {ATTRIBUTES.map((attr) => {
          const unlockedValue = unlockedAttributes[attr.key];

          return (
            <div key={attr.key} className="relative group perspective-1000">
              <AnimatePresence mode="wait">
                {unlockedValue ? (
                  <motion.div
                    key={`unlocked-${attr.key}`}
                    initial={{ rotateY: 90, opacity: 0, scale: 0.95 }}
                    animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                    exit={{ rotateY: -90, opacity: 0 }}
                    transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
                    className="flex flex-col justify-between p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/50 shadow-lg shadow-emerald-950/30"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 mb-1">
                      <span>{attr.label}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-sm font-bold text-emerald-100 truncate">{unlockedValue}</div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`locked-${attr.key}`}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all shadow-inner"
                  >
                    <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1">
                      <span>{attr.label}</span>
                      <Lock className="w-3 h-3 text-slate-500" />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono italic">
                      <span className="w-2 h-2 rounded-full bg-slate-700 animate-pulse" />
                      <span>Locked</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
