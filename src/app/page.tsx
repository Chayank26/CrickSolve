'use client';

import { Header } from '@/components/Header';
import { AttributeCards } from '@/components/AttributeCards';
import { PlayerSearch } from '@/components/PlayerSearch';
import { NumericHintsTable } from '@/components/NumericHintsTable';
import { SilhouetteReveal } from '@/components/SilhouetteReveal';
import { HowToModal } from '@/components/TacticalHintModal';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Silhouette Reveal & Attribute Locking Cards */}
        <section className="lg:col-span-6 flex flex-col gap-6">
          <SilhouetteReveal />
          <AttributeCards />
        </section>

        {/* Right Column: Search Box & Numeric Stat Hints Table */}
        <section className="lg:col-span-6 flex flex-col gap-6">
          <PlayerSearch />
          <NumericHintsTable />
        </section>
      </main>

      {/* Modals */}
      <HowToModal />
    </div>
  );
}
