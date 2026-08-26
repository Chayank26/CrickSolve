'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { formatMmSs } from '@/lib/utils';
import { X, Trophy, Timer, Loader2 } from 'lucide-react';
import { LeaderboardEntry } from '@/types/game';

export function LeaderboardModal() {
  const { activeModal, setActiveModal, currentDate, category, streak } = useGameStore();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [todayPlayer, setTodayPlayer] = useState<{ name: string; country: string; role: string; photoUrl: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeModal === 'leaderboard') {
      fetchAndMergeLeaderboard();
    }
  }, [activeModal, currentDate, category]);

  async function fetchAndMergeLeaderboard() {
    setIsLoading(true);

    let remoteEntries: LeaderboardEntry[] = [];
    let fetchedTodayPlayer = null;

    // 1. Fetch remote Supabase entries
    try {
      const res = await fetch(`/api/leaderboard?date=${currentDate}&category=${category}`);
      const data = await res.json();
      remoteEntries = data.leaderboard || [];
      fetchedTodayPlayer = data.todayPlayer || null;
    } catch (err) {
      console.error('Failed to fetch remote leaderboard', err);
    }

    // 2. Read local entries from localStorage
    let localEntries: LeaderboardEntry[] = [];
    try {
      const raw = localStorage.getItem('cricksolve_leaderboard_v1');
      if (raw) {
        const parsed: LeaderboardEntry[] = JSON.parse(raw);
        localEntries = parsed.filter((e) => e.date === currentDate);
      }
    } catch (err) {
      console.error('Failed to read local leaderboard entries', err);
    }

    // 3. Merge & Deduplicate entries by nickname
    const entryMap = new Map<string, LeaderboardEntry>();

    // Put remote entries first
    remoteEntries.forEach((entry) => {
      entryMap.set(entry.nickname.toLowerCase(), entry);
    });

    // Put/override with local entries
    localEntries.forEach((entry) => {
      entryMap.set(entry.nickname.toLowerCase(), entry);
    });

    const combined = Array.from(entryMap.values());

    // 4. Sort strictly by fastest solve time (time_ms / timeMs ASC) then attempts ASC
    combined.sort((a, b) => {
      const timeA = a.time_ms ?? a.timeMs ?? 999999;
      const timeB = b.time_ms ?? b.timeMs ?? 999999;
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return a.attempts - b.attempts;
    });

    // Update player standing rank in store
    const userIndex = combined.findIndex((e) => e.nickname.toLowerCase() === useGameStore.getState().nickname.toLowerCase());
    if (userIndex !== -1) {
      useGameStore.getState().setUserRank(userIndex + 1);
    } else {
      useGameStore.getState().setUserRank(null);
    }

    setLeaderboard(combined);
    setTodayPlayer(fetchedTodayPlayer);
    setIsLoading(false);
  }

  if (activeModal !== 'leaderboard') return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-5 md:p-6 flex flex-col gap-4 text-black animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header Title */}
        <div className="flex items-center justify-between border-b-3 border-black pb-3">
          <div className="flex items-center gap-3">
            <div className="bg-[#CCFF00] border-2 border-black p-2 text-black">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black">
                TODAY'S LEADERBOARD
              </h2>
              <p className="text-xs font-bold text-slate-600">Ranked by fastest solve time ⏱️</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="bg-white border-2 border-black p-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-100"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Today's Player Info Card */}
        {todayPlayer && (
          <div className="bg-[#7E22CE] text-white border-3 border-black p-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={todayPlayer.photoUrl}
                alt={todayPlayer.name}
                className="w-12 h-12 border-2 border-black object-cover bg-slate-200"
              />
              <div>
                <div className="text-xs font-black uppercase text-[#CCFF00]">TODAY'S MYSTERY PLAYER</div>
                <div className="text-base font-black uppercase">{todayPlayer.name}</div>
                <div className="text-xs font-semibold opacity-90">
                  {todayPlayer.country} • {todayPlayer.role}
                </div>
              </div>
            </div>

            {/* Streak Counter */}
            <div className="bg-[#CCFF00] text-black border-2 border-black px-3 py-1.5 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-[10px] font-black uppercase">STREAK</div>
              <div className="text-sm font-black flex items-center justify-center">
                <span>{streak}</span>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="border-3 border-black bg-slate-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="bg-black text-white grid grid-cols-12 gap-1 p-2 text-center text-xs font-black uppercase">
            <div className="col-span-2 text-left pl-2">RANK</div>
            <div className="col-span-5 text-left">PLAYER</div>
            <div className="col-span-3">SOLVE TIME</div>
            <div className="col-span-2">TRIES</div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-black" />
              <span className="text-xs font-bold uppercase">Loading Leaderboard...</span>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-slate-500 uppercase">
              No scores recorded yet for today! Be the first to win and set a record!
            </div>
          ) : (
            <div className="divide-y-2 divide-black">
              {leaderboard.map((entry, idx) => {
                const rawTimeMs = entry.time_ms ?? entry.timeMs ?? 0;
                const rankColor =
                  idx === 0
                    ? 'bg-[#CCFF00] text-black font-black'
                    : idx === 1
                      ? 'bg-slate-300 text-black font-black'
                      : idx === 2
                        ? 'bg-amber-400 text-black font-black'
                        : 'bg-white text-black font-bold';

                return (
                  <div
                    key={entry.id || idx}
                    className={`grid grid-cols-12 gap-1 p-2.5 items-center text-xs ${idx === 0 ? 'bg-[#CCFF00]/20' : 'hover:bg-slate-100'
                      }`}
                  >
                    <div className="col-span-2 pl-2">
                      <span className={`px-2 py-0.5 border-2 border-black ${rankColor}`}>
                        #{idx + 1}
                      </span>
                    </div>
                    <div className="col-span-5 truncate text-black font-black uppercase">
                      {entry.nickname}
                    </div>
                    <div className="col-span-3 text-center flex items-center justify-center gap-1 text-black font-black">
                      <Timer className="w-3.5 h-3.5" />
                      <span>{formatMmSs(rawTimeMs)}</span>
                    </div>
                    <div className="col-span-2 text-center font-black">
                      {entry.attempts}/7
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Close Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setActiveModal(null)}
            className="bg-black text-[#CCFF00] hover:bg-slate-900 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-6 py-2 text-xs font-black uppercase active:translate-x-0.5 active:translate-y-0.5"
          >
            CLOSE LEADERBOARD
          </button>
        </div>
      </div>
    </div>
  );
}
