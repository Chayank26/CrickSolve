'use client';

import { Header } from '@/components/Header';
import { AttributeCards } from '@/components/AttributeCards';
import { PlayerSearch } from '@/components/PlayerSearch';
import { NumericHintsTable } from '@/components/NumericHintsTable';
import { HowToModal } from '@/components/TacticalHintModal';
import { CalendarModal } from '@/components/CalendarModal';
import { ResultModal } from '@/components/ResultModal';
import { StatsModal } from '@/components/StatsModal';
import { ShareGridModal } from '@/components/ShareGridModal';
import { LeaderboardModal } from '@/components/LeaderboardModal';
import { AttributeHintPickerModal } from '@/components/AttributeHintPickerModal';

export default function Home() {
  return (
    <div className="min-h-screen text-slate-100 flex flex-col p-4 md:p-6 max-w-7xl mx-auto selection:bg-emerald-500 selection:text-black">
      {/* Top Header */}
      <Header />

      {/* Main 2-Column Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-2">
        {/* Left Column: Mystery Player Attribute Cards & Silhouette */}
        <section className="lg:col-span-5 flex flex-col gap-5">
          <AttributeCards />
        </section>

        {/* Right Column: Search/Guess Box & Numeric Hints Table */}
        <section className="lg:col-span-7 flex flex-col gap-5">
          <PlayerSearch />
          <NumericHintsTable />
        </section>
      </main>

      {/* Modals */}
      <HowToModal />
      <CalendarModal />
      <ResultModal />
      <StatsModal />
      <ShareGridModal />
      <LeaderboardModal />
      <AttributeHintPickerModal />
    </div>
  );
}
