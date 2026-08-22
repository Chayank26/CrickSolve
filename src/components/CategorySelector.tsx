'use client';

import { useGameStore } from '@/store/useGameStore';
import { PlayerCategory } from '@/types/game';
import { Trophy, Star, Sparkles, Users } from 'lucide-react';

interface CategoryOption {
  id: PlayerCategory;
  label: string;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'International', label: 'All International', icon: <Trophy className="w-3.5 h-3.5" /> },
  { id: 'IPL', label: 'IPL Stars', icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" /> },
  { id: 'Legend', label: 'Legends', icon: <Star className="w-3.5 h-3.5 text-amber-300" /> },
  { id: 'Womens', label: "Women's Cricket", icon: <Users className="w-3.5 h-3.5 text-pink-400" /> },
];

export function CategorySelector() {
  const { category, setCategory } = useGameStore();

  return (
    <div className="w-full flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {CATEGORIES.map((cat) => {
        const isActive = category === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              isActive
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-950/40'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
