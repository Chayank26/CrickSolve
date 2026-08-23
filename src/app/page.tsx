'use client';

import { Header } from '@/components/Header';
import { PlayerSearch } from '@/components/PlayerSearch';
import { GuessesGrid } from '@/components/GuessesGrid';
import { SilhouetteReveal } from '@/components/SilhouetteReveal';
import { HowToModal } from '@/components/TacticalHintModal';
import { CalendarModal } from '@/components/CalendarModal';
import { ResultModal } from '@/components/ResultModal';
import { StatsModal } from '@/components/StatsModal';
import { ShareGridModal } from '@/components/ShareGridModal';
import { LeaderboardModal } from '@/components/LeaderboardModal';

export default function Home() {
  return (
    <div className="min-h-screen bg-dot-grid text-black font-sans selection:bg-[#CCFF00] selection:text-black flex flex-col p-3 md:p-6">
      <div className="max-w-5xl w-full mx-auto flex flex-col gap-5">
        {/* Top Header */}
        <Header />

        {/* Purple Input Block */}
        <PlayerSearch />

        {/* Main Guesses Grid & Hints */}
        <GuessesGrid />

        {/* Silhouette Unblur Banner */}
        <SilhouetteReveal />
      </div>

      {/* Modals */}
      <HowToModal />
      <CalendarModal />
      <ResultModal />
      <StatsModal />
      <ShareGridModal />
      <LeaderboardModal />
    </div>
  );
}
