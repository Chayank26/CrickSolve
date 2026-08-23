'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { X, Calendar, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

export function CalendarModal() {
  const { activeModal, setActiveModal, syncDailyDate, currentDate } = useGameStore();

  const [viewDate, setViewDate] = useState(new Date());

  if (activeModal !== 'calendar') return null;

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  function handlePrevMonth() {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  }

  function handleNextMonth() {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  }

  function handleSelectDay(day: number) {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const targetDateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;

    syncDailyDate(targetDateStr);
    setActiveModal(null);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-4 text-black animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b-3 border-black pb-3">
          <div className="flex items-center gap-3">
            <div className="bg-[#CCFF00] border-2 border-black p-2 text-black">
              <Calendar className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-black">PAST GAMES</h2>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="bg-white border-2 border-black p-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-100"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between px-1">
          <button onClick={handlePrevMonth} className="bg-white border-2 border-black p-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-100">
            <ChevronLeft className="w-4 h-4 text-black" />
          </button>
          <div className="font-black text-sm uppercase text-black">
            {monthNames[currentMonth]} {currentYear}
          </div>
          <button onClick={handleNextMonth} className="bg-white border-2 border-black p-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-100">
            <ChevronRight className="w-4 h-4 text-black" />
          </button>
        </div>

        {/* Weekday Labels */}
        <div className="grid grid-cols-7 text-center text-[11px] font-black text-slate-700 uppercase py-1">
          <span>SUN</span><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {Array.from({ length: firstDayIndex }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-9" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const formattedMonth = String(currentMonth + 1).padStart(2, '0');
            const formattedDay = String(day).padStart(2, '0');
            const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;

            const isSelected = dateStr === currentDate;
            const isToday = dateStr === todayStr;
            const isFuture = new Date(dateStr) > new Date(todayStr);

            return (
              <button
                key={`day-${day}`}
                disabled={isFuture}
                onClick={() => handleSelectDay(day)}
                className={`h-9 border-2 border-black font-black text-xs transition-all relative ${
                  isSelected
                    ? 'bg-[#CCFF00] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : isToday
                    ? 'bg-[#7E22CE] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : isFuture
                    ? 'opacity-30 bg-slate-100 cursor-not-allowed border-slate-400'
                    : 'bg-white text-black hover:bg-slate-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                <span>{day}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-2 flex justify-between items-center border-t-3 border-black">
          <button
            onClick={() => {
              syncDailyDate(todayStr);
              setActiveModal(null);
            }}
            className="flex items-center gap-1.5 text-xs text-black font-black uppercase hover:underline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>JUMP TO TODAY</span>
          </button>

          <button
            onClick={() => setActiveModal(null)}
            className="bg-black text-white hover:bg-slate-900 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] px-5 py-1.5 text-xs font-black uppercase active:translate-x-0.5 active:translate-y-0.5"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
