'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { X, Calendar, ChevronLeft, ChevronRight, Check, RotateCcw } from 'lucide-react';

export function CalendarModal() {
  const { activeModal, setActiveModal, syncDailyDate, currentDate } = useGameStore();

  const [viewDate, setViewDate] = useState(new Date());

  if (activeModal !== 'calendar') return null;

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // Days in month calculation
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-bold text-slate-100">Past Daily Puzzles</h2>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between px-2">
          <button onClick={handlePrevMonth} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="font-bold text-sm text-slate-100">
            {monthNames[currentMonth]} {currentYear}
          </div>
          <button onClick={handleNextMonth} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday Labels */}
        <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400 uppercase py-1">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
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
                className={`h-9 rounded-xl flex items-center justify-center text-xs font-semibold transition-all relative border ${
                  isSelected
                    ? 'bg-teal-500/30 border-teal-400 text-teal-200 shadow-md'
                    : isToday
                    ? 'bg-slate-800 border-slate-600 text-slate-100'
                    : isFuture
                    ? 'opacity-30 border-transparent cursor-not-allowed'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <span>{day}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-2 flex justify-between items-center border-t border-slate-800">
          <button
            onClick={() => {
              syncDailyDate(todayStr);
              setActiveModal(null);
            }}
            className="flex items-center gap-1.5 text-xs text-teal-400 hover:underline font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Jump to Today</span>
          </button>

          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
