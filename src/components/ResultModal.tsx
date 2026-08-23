'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import confetti from 'canvas-confetti';
import { Trophy, Share2, RotateCcw, AlertCircle, Timer } from 'lucide-react';
import { LeaderboardEntry } from '@/types/game';

export function ResultModal() {
  const {
    activeModal,
    setActiveModal,
    gameStatus,
    guesses,
    gameMode,
    resetGame,
    currentDate,
    startTimeMs,
    endTimeMs,
    nickname,
    setNickname,
  } = useGameStore();

  const [inputName, setInputName] = useState(nickname || 'Cricketer');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isWon = gameStatus === 'WON';
  const isLost = gameStatus === 'LOST';

  // Calculate solve time in seconds from first guess to winning guess
  const start = startTimeMs || Date.now();
  const end = endTimeMs || Date.now();
  const solveTimeSecs = Math.max(1, Math.round((end - start) / 1000));
  const solveTimeMs = Math.max(1000, end - start);

  useEffect(() => {
    if (activeModal === 'result' && isWon) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [activeModal, isWon]);

  if (activeModal !== 'result' || (!isWon && !isLost)) return null;

  const targetPlayer = guesses.length > 0 ? guesses[guesses.length - 1].guessedPlayer : null;

  async function handleSubmitLeaderboard(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = inputName.trim() || 'Cricketer';
    if (isSubmitting) return;

    setIsSubmitting(true);
    setNickname(cleanName);

    const uid = `user_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now()}`;
    const newEntry: LeaderboardEntry = {
      id: `${currentDate}_${uid}`,
      date: currentDate,
      userId: uid,
      nickname: cleanName,
      attempts: guesses.length,
      timeMs: solveTimeMs,
      time_ms: solveTimeMs,
      createdAt: new Date().toISOString(),
    };

    // 1. Save locally in localStorage for instant 100% reliable display
    try {
      const existingRaw = localStorage.getItem('cricksolve_leaderboard_v1');
      const existing: LeaderboardEntry[] = existingRaw ? JSON.parse(existingRaw) : [];
      // Remove previous entry for same date & nickname if exists
      const filtered = existing.filter((e) => !(e.date === currentDate && e.nickname === cleanName));
      const updated = [...filtered, newEntry];
      localStorage.setItem('cricksolve_leaderboard_v1', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save score to localStorage', err);
    }

    // 2. Post to Supabase API
    try {
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: currentDate,
          userId: uid,
          nickname: cleanName,
          attempts: guesses.length,
          timeMs: solveTimeMs,
        }),
      });
    } catch (err) {
      console.error('Failed to push score to backend API', err);
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setActiveModal('leaderboard');
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-5 text-black animate-in fade-in zoom-in-95 duration-150 text-center">
        {/* Banner Status Header */}
        <div className="flex flex-col items-center gap-2">
          {isWon ? (
            <div className="bg-[#CCFF00] border-3 border-black p-3 text-black">
              <Trophy className="w-8 h-8 animate-bounce" />
            </div>
          ) : (
            <div className="bg-rose-500 border-3 border-black p-3 text-white">
              <AlertCircle className="w-8 h-8" />
            </div>
          )}

          <h2 className="text-2xl font-black uppercase tracking-tight text-black">
            {isWon ? 'SPECTACULAR WIN! 🏆' : 'GAME OVER'}
          </h2>
          <p className="text-xs font-bold text-slate-600">
            {isWon
              ? `You solved the puzzle in ${guesses.length} tries!`
              : 'You ran out of guess attempts for today.'}
          </p>
        </div>

        {/* Player Reveal Card */}
        {targetPlayer && (
          <div className="bg-[#7E22CE] text-white border-3 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 text-left">
            <img
              src={targetPlayer.photoUrl}
              alt={targetPlayer.name}
              className="w-14 h-14 border-2 border-black object-cover bg-slate-200"
            />
            <div>
              <div className="text-xs font-black uppercase text-[#CCFF00]">MYSTERY CRICKETER</div>
              <div className="text-lg font-black uppercase">{targetPlayer.name}</div>
              <div className="text-xs font-semibold opacity-90">
                {targetPlayer.country} • {targetPlayer.role}
              </div>
            </div>
          </div>
        )}

        {/* Solve Time & Stats Box */}
        {isWon && (
          <div className="bg-[#CCFF00] border-3 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-around font-black text-xs uppercase text-black">
            <div className="flex items-center gap-1.5">
              <Timer className="w-4 h-4" />
              <span>SOLVE TIME: {solveTimeSecs} SECONDS</span>
            </div>
            <div>|</div>
            <div>TRIES: {guesses.length}/7</div>
          </div>
        )}

        {/* Name Input Form for Leaderboard Submission */}
        {isWon && !isSubmitted && (
          <form onSubmit={handleSubmitLeaderboard} className="flex flex-col gap-2 pt-1 text-left">
            <label className="text-xs font-black uppercase text-black">
              Enter Your Name For Leaderboard:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                required
                maxLength={20}
                placeholder="Your Name (e.g. Rahul)..."
                className="flex-1 bg-white border-3 border-black p-2.5 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                type="submit"
                disabled={isSubmitting || !inputName.trim()}
                className="bg-[#7E22CE] text-white font-black border-3 border-black px-4 py-2.5 text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-[#6B21A8] active:translate-x-0.5 active:translate-y-0.5"
              >
                SUBMIT
              </button>
            </div>
          </form>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => setActiveModal('share')}
            className="bg-[#CCFF00] text-black font-black border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-2.5 text-xs uppercase flex items-center justify-center gap-2 hover:brightness-105 active:translate-x-0.5 active:translate-y-0.5"
          >
            <Share2 className="w-4 h-4" />
            <span>SHARE SCORE</span>
          </button>

          {gameMode === 'unlimited' ? (
            <button
              onClick={() => {
                resetGame();
                setActiveModal(null);
              }}
              className="bg-black text-white font-black border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-2.5 text-xs uppercase flex items-center justify-center gap-2 active:translate-x-0.5 active:translate-y-0.5"
            >
              <RotateCcw className="w-4 h-4 text-[#CCFF00]" />
              <span>NEXT PLAYER</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveModal('leaderboard')}
              className="bg-[#7E22CE] text-white font-black border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-2.5 text-xs uppercase flex items-center justify-center gap-2 active:translate-x-0.5 active:translate-y-0.5"
            >
              <Trophy className="w-4 h-4 text-[#CCFF00]" />
              <span>LEADERBOARD</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
