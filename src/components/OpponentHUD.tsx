'use client';

import { motion } from 'framer-motion';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import { useGameStore } from '@/store/useGameStore';
import { Swords, Trophy, Crown, Sparkles, LogOut, RefreshCw } from 'lucide-react';
import { AttributeMatchResult, NumericMatchResult } from '@/types/game';

interface OpponentHUDProps {
  onOpenLobby?: () => void;
}

export function OpponentHUD({ onOpenLobby }: OpponentHUDProps) {
  const { room, userId, isMatchActive, matchWinner, requestRematch, leaveRoom } = useMultiplayerStore();
  const { guesses, gameStatus, setActiveModal } = useGameStore();

  if (!room) return null;

  const opponents = room.participants.filter((p) => p.userId !== userId);
  const self = room.participants.find((p) => p.userId === userId);
  const isHost = room.hostId === userId;
  const isWon = gameStatus === 'WON';

  const renderMiniTile = (isMatch: boolean | 'match' | 'higher' | 'lower' | undefined, key: string) => {
    let colorClass = 'bg-neutral-300 border-black';
    if (isMatch === true || isMatch === 'match') {
      colorClass = 'bg-[#CCFF00] border-black';
    } else if (isMatch === 'higher' || isMatch === 'lower') {
      colorClass = 'bg-[#FF5500] border-black';
    } else if (isMatch === false) {
      colorClass = 'bg-neutral-700 border-black';
    }

    return (
      <div
        key={key}
        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 border border-black ${colorClass} transition-colors`}
      />
    );
  };

  const renderRecentMiniGrid = (
    attributeMatches?: AttributeMatchResult,
    numericMatches?: NumericMatchResult
  ) => {
    if (!attributeMatches || !numericMatches) {
      return (
        <div className="flex items-center gap-1 opacity-40">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3 border border-dashed border-neutral-400" />
          ))}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        {renderMiniTile(attributeMatches.country, 'country')}
        {renderMiniTile(attributeMatches.role, 'role')}
        {renderMiniTile(attributeMatches.battingHand, 'battingHand')}
        {renderMiniTile(attributeMatches.bowlingType, 'bowlingType')}
        {renderMiniTile(attributeMatches.iplTeam, 'iplTeam')}
        {renderMiniTile(attributeMatches.retired, 'retired')}
        {renderMiniTile(numericMatches.birthYear, 'birth')}
        {renderMiniTile(numericMatches.tests, 'tests')}
        {renderMiniTile(numericMatches.odis, 'odis')}
        {renderMiniTile(numericMatches.t20is, 't20is')}
      </div>
    );

  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-black text-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 flex flex-col gap-3 mb-2"
    >
      {/* Top Header Status Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b-2 border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="bg-[#CCFF00] text-black px-2.5 py-1 text-xs font-black uppercase border border-black flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5" />
            <span>LIVE 1v1 DUEL</span>
          </div>
          <span className="text-xs font-black text-neutral-300 uppercase">
            ROOM CODE: <span className="text-[#CCFF00] font-black">{room.roomCode}</span>
          </span>
        </div>

        {/* Status Announcement Banner */}
        <div className="text-xs font-black uppercase flex items-center gap-2">
          {matchWinner ? (
            <span className="bg-[#CCFF00] text-black px-2.5 py-0.5 border border-black animate-bounce flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>
                {matchWinner.winnerUserId === userId
                  ? 'VICTORY! YOU SOLVED FIRST! 🏆'
                  : `${matchWinner.winnerNickname} WON THE DUEL!`}
              </span>
            </span>
          ) : isMatchActive || room.status === 'in_progress' ? (
            <span className="text-[#CCFF00] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-ping" />
              <span>RACING IN REAL-TIME</span>
            </span>
          ) : (
            <span className="text-neutral-400">WAITING FOR MATCH START</span>
          )}
        </div>

        {/* Quick Room Actions */}
        <div className="flex items-center gap-2">
          {matchWinner && (
            <button
              onClick={requestRematch}
              className="bg-[#7E22CE] text-white border-2 border-white px-2.5 py-1 text-xs font-black uppercase hover:brightness-110 active:translate-x-0.5 transition-all flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3 text-[#CCFF00]" />
              <span>REMATCH</span>
            </button>
          )}

          <button
            onClick={() => {
              if (onOpenLobby) onOpenLobby();
              else setActiveModal('multiplayer');
            }}
            className="bg-neutral-800 text-neutral-200 border border-neutral-600 px-2 py-1 text-xs font-black uppercase hover:bg-neutral-700 transition-all"
          >
            LOBBY
          </button>

          <button
            onClick={leaveRoom}
            className="text-red-400 hover:text-red-300 p-1 transition-colors"
            title="Leave Multiplayer Match"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Duel Scoreboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* YOU Section */}
        <div className="bg-neutral-900 border-2 border-neutral-800 p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-[#CCFF00] text-black font-black text-xs px-2 py-0.5 uppercase">
                YOU
              </span>
              <span className="text-sm font-black uppercase text-white">{self?.nickname || 'You'}</span>
            </div>

            <div className="text-xs font-black uppercase text-[#CCFF00]">
              {isWon ? 'SOLVED! 🏆' : `GUESS: ${guesses.length}/7`}
            </div>
          </div>

          {/* Your Recent Guess Mini Matrix */}
          <div className="flex items-center justify-between text-[11px] text-neutral-400 uppercase font-bold pt-1">
            <span>Your Live Wordle Grid:</span>
            {guesses.length > 0 ? (
              renderRecentMiniGrid(
                guesses[guesses.length - 1].attributeMatches,
                guesses[guesses.length - 1].numericMatches
              )
            ) : (
              <span className="text-neutral-500 italic text-[10px]">No guesses yet</span>
            )}
          </div>
        </div>

        {/* OPPONENT(S) Section */}
        {opponents.length === 0 ? (
          <div className="bg-neutral-900 border-2 border-dashed border-neutral-700 p-3 flex items-center justify-center text-xs font-bold text-neutral-400 uppercase">
            ⏳ Waiting for challenger to join room...
          </div>
        ) : (
          opponents.map((opp) => (
            <div
              key={opp.userId}
              className={`bg-neutral-900 border-2 p-3 flex flex-col gap-2 transition-all ${
                opp.isSolved ? 'border-[#CCFF00] bg-[#CCFF00]/10' : 'border-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {opp.role === 'host' ? (
                    <div className="bg-[#7E22CE] text-[#CCFF00] p-1 border border-black">
                      <Crown className="w-3 h-3" />
                    </div>
                  ) : (
                    <div className="bg-neutral-700 text-white p-1 border border-black">
                      <Swords className="w-3 h-3" />
                    </div>
                  )}
                  <span className="text-sm font-black uppercase text-white">{opp.nickname}</span>
                </div>

                <div className="text-xs font-black uppercase">
                  {opp.isSolved ? (
                    <span className="bg-[#CCFF00] text-black px-2 py-0.5 border border-black font-black">
                      SOLVED! 🏆
                    </span>
                  ) : (
                    <span className="text-neutral-300">GUESS: {opp.guessesCount}/7</span>
                  )}
                </div>
              </div>

              {/* Opponent's Realtime Wordle Color Grid */}
              <div className="flex items-center justify-between text-[11px] text-neutral-400 uppercase font-bold pt-1">
                <span>Opponent&apos;s Grid:</span>
                {opp.recentGuessMatches ? (
                  renderRecentMiniGrid(
                    opp.recentGuessMatches.attributeMatches,
                    opp.recentGuessMatches.numericMatches
                  )
                ) : (
                  <span className="text-neutral-500 italic text-[10px]">No guesses yet</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
