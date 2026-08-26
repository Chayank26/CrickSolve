'use client';

import { useGameStore } from '@/store/useGameStore';
import { getDailyTargetPlayer } from '@/lib/game-engine';
import { PLAYERS } from '@/data/players';
import { X, Lightbulb, Globe, UserCheck, Calendar, Trophy, ShieldAlert, Activity } from 'lucide-react';

export function AttributeHintPickerModal() {
  const { activeModal, setActiveModal, currentDate, category, gameMode, unlimitedTargetId, revealAttributeHint } = useGameStore();

  if (activeModal !== 'hintPicker') return null;

  // Resolve target player
  let targetPlayer = getDailyTargetPlayer(currentDate, category);
  if (gameMode === 'unlimited' && unlimitedTargetId) {
    const found = PLAYERS.find((p) => p.id === unlimitedTargetId);
    if (found) targetPlayer = found;
  }

  const attributesList = [
    {
      key: 'country',
      label: 'Country',
      icon: Globe,
      value: targetPlayer.country,
    },
    {
      key: 'role',
      label: 'Player Role',
      icon: UserCheck,
      value: targetPlayer.role,
    },
    {
      key: 'battingHand',
      label: 'Batting Hand',
      icon: Activity,
      value: targetPlayer.battingHand,
    },
    {
      key: 'birthYear',
      label: 'Birth Year',
      icon: Calendar,
      value: String(targetPlayer.birthYear),
    },
    {
      key: 'iplTeam',
      label: 'IPL Team',
      icon: Trophy,
      value: targetPlayer.iplTeam === 'None' ? 'Not in IPL' : targetPlayer.iplTeam,
    },
    {
      key: 'retired',
      label: 'Retired Status',
      icon: ShieldAlert,
      value: targetPlayer.retired ? 'Retired' : 'Active (Not Retired)',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-4 text-black animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b-3 border-black pb-3">
          <div className="flex items-center gap-3">
            <div className="bg-[#CCFF00] border-2 border-black p-2 text-black">
              <Lightbulb className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-black">
                SELECT ATTRIBUTE TO REVEAL 💡
              </h2>
              <p className="text-xs font-bold text-slate-600">Click any attribute to unlock its value!</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="bg-white border-2 border-black p-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-100"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Attribute Buttons Grid */}
        <div className="grid grid-cols-2 gap-3 py-1">
          {attributesList.map((attr) => {
            const Icon = attr.icon;
            return (
              <button
                key={attr.key}
                onClick={() => revealAttributeHint(attr.label, attr.value)}
                className="bg-slate-50 hover:bg-[#CCFF00] border-3 border-black p-3.5 flex flex-col items-center text-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all group"
              >
                <Icon className="w-6 h-6 text-black group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black uppercase text-black">{attr.label}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-1 flex justify-end">
          <button
            onClick={() => setActiveModal(null)}
            className="bg-black text-white border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] px-5 py-2 text-xs font-black uppercase"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
