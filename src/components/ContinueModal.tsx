'use client';

import { useGameStore } from '@/store/useGameStore';
import { getDailyTargetPlayer } from '@/lib/game-engine';
import { PLAYERS } from '@/data/players';
import { HelpCircle, Lightbulb } from 'lucide-react';

export function ContinueModal() {
  const {
    activeModal,
    setActiveModal,
    currentDate,
    category,
    gameMode,
    unlimitedTargetId,
    guesses,
    manuallyUnlockedAttributes,
    enableBonusChance,
    unlockAttributeByHint,
    revealAttributeHint,
  } = useGameStore();

  if (activeModal !== 'continue') return null;

  // Resolve target player
  let targetPlayer = getDailyTargetPlayer(currentDate, category);
  if (gameMode === 'unlimited' && unlimitedTargetId) {
    const found = PLAYERS.find((p) => p.id === unlimitedTargetId);
    if (found) targetPlayer = found;
  }

  // Check matched attributes
  const matchedCountry = guesses.some((g) => g.attributeMatches.country) || !!manuallyUnlockedAttributes.country;
  const matchedBatting = guesses.some((g) => g.attributeMatches.battingHand) || !!manuallyUnlockedAttributes.battingHand;
  const matchedBowling = guesses.some((g) => g.attributeMatches.bowlingType) || !!manuallyUnlockedAttributes.bowlingType;
  const matchedRole = guesses.some((g) => g.attributeMatches.role) || !!manuallyUnlockedAttributes.role;
  const matchedIpl = guesses.some((g) => g.attributeMatches.iplTeam) || !!manuallyUnlockedAttributes.iplTeam;
  const matchedRetired = guesses.some((g) => g.attributeMatches.retired) || !!manuallyUnlockedAttributes.retired;

  const attributeCandidates = [
    { key: 'country', label: 'Country', value: targetPlayer.country, matched: matchedCountry },
    { key: 'role', label: 'Role', value: targetPlayer.role, matched: matchedRole },
    { key: 'battingHand', label: 'Batting Hand', value: targetPlayer.battingHand, matched: matchedBatting },
    { key: 'bowlingType', label: 'Bowling Style', value: targetPlayer.bowlingType, matched: matchedBowling },
    { key: 'iplTeam', label: 'IPL Team', value: targetPlayer.iplTeam === 'None' ? 'Not in IPL' : targetPlayer.iplTeam, matched: matchedIpl },
    { key: 'retired', label: 'Retired', value: targetPlayer.retired ? 'YES' : 'NO', matched: matchedRetired },
  ];

  const firstLocked = attributeCandidates.find((a) => !a.matched);
  const allAttributesUnlocked = !firstLocked;

  const handleYes = () => {
    enableBonusChance();
    if (firstLocked) {
      unlockAttributeByHint(firstLocked.key, firstLocked.label, firstLocked.value);
    } else {
      revealAttributeHint(
        'Stats',
        `Birth: ${targetPlayer.birthYear} • Tests: ${targetPlayer.tests} • ODIs: ${targetPlayer.odis} • T20Is: ${targetPlayer.t20is}`
      );
    }
    setActiveModal(null);
  };

  const handleNo = () => {
    const { gamesPlayed } = useGameStore.getState();
    useGameStore.setState({
      gameStatus: 'LOST',
      streak: 0,
      gamesPlayed: gamesPlayed + 1,
      activeModal: 'result',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-4 text-black animate-in fade-in zoom-in-95 duration-150 text-center">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 border-b-3 border-black pb-3">
          <div className="bg-[#CCFF00] border-3 border-black p-3 text-black">
            <HelpCircle className="w-8 h-8 animate-bounce text-black" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-black">
            DO YOU WANT ANOTHER GUESS? 🏏
          </h2>
          <p className="text-xs font-bold text-slate-600">
            You have used 7 attempts. Would you like 1 bonus guess to solve the puzzle?
          </p>
        </div>

        {/* Bonus Hint Box Offered */}
        <div className="bg-[#CCFF00] border-3 border-black p-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex flex-col gap-1">
          <div className="text-xs font-black uppercase text-black flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-black fill-black" />
            <span>BONUS HINT OFFERED:</span>
          </div>
          <div className="text-sm font-black uppercase text-black mt-0.5">
            {firstLocked ? (
              <span>
                {firstLocked.label}: <span className="underline decoration-2">{firstLocked.value}</span>
              </span>
            ) : (
              <span>
                BIRTH: {targetPlayer.birthYear} • TESTS: {targetPlayer.tests} • ODIS: {targetPlayer.odis} • T20IS: {targetPlayer.t20is}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleYes}
            className="bg-[#CCFF00] text-black font-black border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-3 text-xs uppercase hover:brightness-105 active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            YES (1 MORE GUESS)
          </button>

          <button
            onClick={handleNo}
            className="bg-black text-white font-black border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-3 text-xs uppercase hover:bg-slate-900 active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            NO
          </button>
        </div>
      </div>
    </div>
  );
}
