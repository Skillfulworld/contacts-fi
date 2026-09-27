"use client";

import { useEffect, useRef } from 'react';
import { X, Flame, Trophy, Star } from 'lucide-react';
import { usePoints, WEEKLY_REWARDS, GRAND_PRIZE_30, GRAND_PRIZE_STREAK } from '@/hooks/usePoints';

interface CheckInPanelProps {
  onClose: () => void;
}

export default function CheckInPanel({ onClose }: CheckInPanelProps) {
  const {
    total,
    streak,
    weeklyDays,
    isCheckInAvailable,
    cycleDay,
    todayPoints,
    completedWeeklyDays,
    doCheckIn,
  } = usePoints();

  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleCheckIn = () => {
    if (!isCheckInAvailable) return;
    doCheckIn();
  };

  // Streak progress toward 30-day grand prize
  const grandPrizeProgress = Math.min(streak, GRAND_PRIZE_STREAK);
  const grandPrizePct = Math.round((grandPrizeProgress / GRAND_PRIZE_STREAK) * 100);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-[2px]" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-4 top-[72px] z-[101] w-[360px] max-w-[calc(100vw-2rem)] rounded-3xl border border-[#E5E7EB] bg-white shadow-[0_24px_64px_rgba(17,24,39,0.14)] overflow-hidden"
        style={{ animation: 'slideDown 0.18s ease-out' }}
      >
        <style>{`
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-8px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0)   scale(1);    }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F3F4F6] px-5 py-4">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-[#FF7A59]" />
            <span className="font-semibold text-[#1C1C1E]">Daily Check-in</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#6B7280] hover:bg-[#F3F4F6]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Points summary */}
        <div className="flex items-center justify-between bg-[#F5F6F8] px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280]">Total Points</p>
            <p className="text-3xl font-bold text-[#1C1C1E]">{total.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280]">Streak</p>
            <div className="flex items-center gap-1 justify-end">
              <Flame className="h-4 w-4 text-[#FF7A59]" />
              <p className="text-3xl font-bold text-[#1C1C1E]">{streak}</p>
            </div>
          </div>
        </div>

        {/* 7-day weekly grid */}
        <div className="px-5 pt-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280]">
            Weekly Cycle — {completedWeeklyDays}/7 days
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKLY_REWARDS.map((pts, i) => {
              const done = weeklyDays[i];
              const isToday = !done && i === cycleDay && isCheckInAvailable;
              const isFuture = !done && i > cycleDay;
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-1 rounded-2xl py-2 border transition-all ${
                    done
                      ? 'bg-[#6D5DF6] border-[#6D5DF6] text-white'
                      : isToday
                      ? 'bg-[#EDEBFF] border-[#6D5DF6] text-[#6D5DF6]'
                      : 'bg-[#F5F6F8] border-[#E5E7EB] text-[#9CA3AF]'
                  }`}
                >
                  <span className="text-[9px] font-bold uppercase tracking-wide">
                    {['Mo','Tu','We','Th','Fr','Sa','Su'][i]}
                  </span>
                  <span className={`text-xs font-bold ${isFuture ? 'opacity-40' : ''}`}>
                    {i === 6 ? '🏆' : `+${pts}`}
                  </span>
                  {done && <div className="h-1 w-1 rounded-full bg-white/70" />}
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-[#9CA3AF]">
            Complete all 7 days for <strong className="text-[#1C1C1E]">61 pts</strong> total. Day 7 awards <strong className="text-[#1C1C1E]">15 pts</strong>.
          </p>
        </div>

        {/* Check-in button */}
        <div className="px-5 py-4">
          {isCheckInAvailable ? (
            <button
              onClick={handleCheckIn}
              className="w-full rounded-2xl bg-[#6D5DF6] py-3.5 font-semibold text-white shadow-[0_8px_24px_rgba(109,93,246,0.22)] transition-all active:scale-[0.98] hover:bg-[#5B4DE0]"
            >
              Check in · +{todayPoints} pts
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#F3F4F6] py-3.5 text-sm font-semibold text-[#6B7280]">
              <Star className="h-4 w-4 text-[#6D5DF6]" />
              Already checked in today
            </div>
          )}
        </div>

        {/* 30-day grand prize progress */}
        <div className="border-t border-[#F3F4F6] px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-[#FFB347]" />
              <span className="text-sm font-semibold text-[#1C1C1E]">30-Day Grand Prize</span>
            </div>
            <span className="text-sm font-bold text-[#FFB347]">+{GRAND_PRIZE_30} pts</span>
          </div>
          <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FFB347] to-[#FF7A59] transition-all duration-500"
              style={{ width: `${grandPrizePct}%` }}
            />
          </div>
          <p className="text-[10px] text-[#9CA3AF]">
            {grandPrizeProgress} / {GRAND_PRIZE_STREAK} consecutive days
            {streak >= GRAND_PRIZE_STREAK ? ' — 🏆 Unlocked!' : ''}
          </p>
        </div>
      </div>
    </>
  );
}
