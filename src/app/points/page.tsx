"use client";

import { useState } from 'react';
import { Flame, Trophy, Star, CheckCircle2, Circle, Zap, ArrowUpRight, Gift } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { usePoints, WEEKLY_REWARDS, GRAND_PRIZE_30, GRAND_PRIZE_STREAK } from '@/hooks/usePoints';

// ─── Tasks definition (expandable in future) ──────────────────────────────────
const TASKS = [
  {
    id: 'daily_checkin',
    label: 'Daily Check-in',
    description: 'Check in every day to build your streak.',
    pts: '5–15 pts/day',
    icon: Flame,
    color: 'text-[#FF7A59] bg-[#FFF0EA]',
    repeatable: true,
  },
  {
    id: 'send_usdc',
    label: 'Send USDC',
    description: 'Send USDC to a contact.',
    pts: '10 pts',
    icon: ArrowUpRight,
    color: 'text-[#6D5DF6] bg-[#EDEBFF]',
    comingSoon: true,
  },
  {
    id: 'bridge_usdc',
    label: 'Bridge USDC',
    description: 'Bridge USDC across chains via CCTP.',
    pts: '15 pts',
    icon: Zap,
    color: 'text-[#60B8FF] bg-[#EAF4FF]',
    comingSoon: true,
  },
  {
    id: 'add_contact',
    label: 'Add a Contact',
    description: 'Save a new contact with a wallet address.',
    pts: '5 pts',
    icon: Star,
    color: 'text-[#FFB347] bg-[#FFF8EA]',
    comingSoon: true,
  },
  {
    id: 'grand_prize_30',
    label: '30-Day Streak',
    description: 'Maintain a 30-day consecutive check-in streak.',
    pts: `+${GRAND_PRIZE_30} pts bonus`,
    icon: Trophy,
    color: 'text-[#FFB347] bg-[#FFF8EA]',
    milestone: true,
  },
];

export default function PointsPage() {
  const {
    total,
    streak,
    weeklyDays,
    ledger,
    isCheckInAvailable,
    cycleDay,
    todayPoints,
    completedWeeklyDays,
    doCheckIn,
  } = usePoints();

  const [checkedIn, setCheckedIn] = useState(false);

  const handleCheckIn = () => {
    if (!isCheckInAvailable) return;
    doCheckIn();
    setCheckedIn(true);
    setTimeout(() => setCheckedIn(false), 3000);
  };

  const grandPrizeProgress = Math.min(streak, GRAND_PRIZE_STREAK);
  const grandPrizePct = Math.round((grandPrizeProgress / GRAND_PRIZE_STREAK) * 100);

  const dashboard = (
    <div className="w-full px-4 py-5 pb-28 lg:pb-6 lg:px-6 space-y-4 overflow-y-auto">

      {/* Top stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-[#6D5DF6] p-5 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-70 mb-1">Total Points</p>
          <p className="text-4xl font-bold">{total.toLocaleString()}</p>
          <p className="text-[11px] opacity-60 mt-1">Settle Exchange</p>
        </div>
        <div className="rounded-3xl bg-[#1C1C1E] p-5 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-60 mb-1">Streak</p>
          <div className="flex items-end gap-1">
            <p className="text-4xl font-bold">{streak}</p>
            <Flame className="h-6 w-6 text-[#FF7A59] mb-1" />
          </div>
          <p className="text-[11px] opacity-50 mt-1">Consecutive days</p>
        </div>
      </div>

      {/* Daily check-in card */}
      <div className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-[0_8px_24px_rgba(17,24,39,0.06)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] mb-0.5">Weekly Check-in</p>
            <p className="font-semibold text-[#1C1C1E]">{completedWeeklyDays}/7 days complete</p>
          </div>
          {isCheckInAvailable ? (
            <span className="rounded-full bg-[#FDECEC] px-3 py-1 text-[11px] font-semibold text-[#D64545]">Available</span>
          ) : (
            <span className="rounded-full bg-[#EAF4FF] px-3 py-1 text-[11px] font-semibold text-[#4DA3FF]">Done today</span>
          )}
        </div>

        {/* 7-day grid */}
        <div className="grid grid-cols-7 gap-1.5 mb-4">
          {WEEKLY_REWARDS.map((pts, i) => {
            const done = weeklyDays[i];
            const isToday = !done && i === cycleDay && isCheckInAvailable;
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
                <span className="text-[8px] font-bold uppercase">
                  {['M','T','W','T','F','S','S'][i]}
                </span>
                <span className="text-[10px] font-bold">
                  {i === 6 ? '🏆' : `+${pts}`}
                </span>
              </div>
            );
          })}
        </div>

        {isCheckInAvailable ? (
          <button
            onClick={handleCheckIn}
            className="w-full rounded-2xl bg-[#6D5DF6] py-3.5 font-semibold text-white shadow-[0_8px_24px_rgba(109,93,246,0.22)] transition-all active:scale-[0.98] hover:bg-[#5B4DE0]"
          >
            {checkedIn ? '✓ Checked in!' : `Check in · +${todayPoints} pts`}
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#F3F4F6] py-3 text-sm font-semibold text-[#6B7280]">
            <CheckCircle2 className="h-4 w-4 text-[#6D5DF6]" />
            Checked in today — come back tomorrow
          </div>
        )}
      </div>

      {/* 30-day grand prize */}
      <div className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-[0_8px_24px_rgba(17,24,39,0.06)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#FFB347]" />
            <span className="font-semibold text-[#1C1C1E]">30-Day Grand Prize</span>
          </div>
          <span className="rounded-full bg-[#FFF8EA] px-3 py-1 text-sm font-bold text-[#FFB347]">+{GRAND_PRIZE_30} pts</span>
        </div>
        <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FFB347] to-[#FF7A59] transition-all duration-500"
            style={{ width: `${grandPrizePct}%` }}
          />
        </div>
        <p className="text-xs text-[#6B7280]">
          {grandPrizeProgress} / {GRAND_PRIZE_STREAK} consecutive days
          {streak >= GRAND_PRIZE_STREAK ? ' — 🏆 Unlocked!' : ` — ${GRAND_PRIZE_STREAK - grandPrizeProgress} more to go`}
        </p>
      </div>

      {/* Tasks */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] px-1">Tasks</p>
        <div className="space-y-2">
          {TASKS.map(task => {
            const Icon = task.icon;
            return (
              <div
                key={task.id}
                className="flex items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3.5 shadow-[0_4px_12px_rgba(17,24,39,0.04)]"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${task.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1C1C1E] text-sm">{task.label}</span>
                    {task.comingSoon && (
                      <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Soon</span>
                    )}
                    {task.milestone && (
                      <span className="rounded-full bg-[#FFF8EA] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#FFB347]">Milestone</span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5 truncate">{task.description}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-sm font-bold text-[#6D5DF6]">{task.pts}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Points history */}
      {ledger.length > 0 && (
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] px-1">History</p>
          <div className="rounded-3xl border border-[#E5E7EB] bg-white overflow-hidden shadow-[0_8px_24px_rgba(17,24,39,0.06)]">
            {ledger.slice(0, 20).map((event, idx) => (
              <div
                key={event.id}
                className={`flex items-center justify-between px-4 py-3 ${idx < ledger.slice(0, 20).length - 1 ? 'border-b border-[#F3F4F6]' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    event.type === 'bonus' ? 'bg-[#FFF8EA] text-[#FFB347]' : 'bg-[#EDEBFF] text-[#6D5DF6]'
                  }`}>
                    {event.type === 'bonus' ? <Gift className="h-4 w-4" /> : <Flame className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1C1C1E]">{event.label}</p>
                    <p className="text-xs text-[#9CA3AF]">
                      {new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-[#6D5DF6]">+{event.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {ledger.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-[#E5E7EB] bg-white py-12 text-center shadow-[0_8px_24px_rgba(17,24,39,0.04)]">
          <Circle className="h-10 w-10 text-[#E5E7EB] mb-3" />
          <p className="font-semibold text-[#1C1C1E]">No activity yet</p>
          <p className="text-sm text-[#6B7280] mt-1">Check in daily to start earning points.</p>
        </div>
      )}
    </div>
  );

  return (
    <PageLayout fullWidth>
      <div className="w-full h-full lg:h-[calc(100dvh-65px)] lg:overflow-y-auto lg:grid lg:grid-cols-2 lg:gap-0">
        {/* Left column on desktop */}
        <div className="lg:border-r lg:border-[#E5E7EB] lg:overflow-y-auto">
          {dashboard}
        </div>
        {/* Right column — tasks + history, desktop only */}
        <div className="hidden lg:block lg:overflow-y-auto px-6 py-5 space-y-4">
          {/* Points summary header */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-[#6D5DF6] p-5 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-70 mb-1">Total Points</p>
              <p className="text-4xl font-bold">{total.toLocaleString()}</p>
            </div>
            <div className="rounded-3xl bg-[#1C1C1E] p-5 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-60 mb-1">Streak</p>
              <div className="flex items-end gap-1">
                <p className="text-4xl font-bold">{streak}</p>
                <Flame className="h-6 w-6 text-[#FF7A59] mb-1" />
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] px-1">Tasks</p>
            <div className="space-y-2">
              {TASKS.map(task => {
                const Icon = task.icon;
                return (
                  <div key={task.id} className="flex items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3.5">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${task.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#1C1C1E] text-sm">{task.label}</span>
                        {task.comingSoon && <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Soon</span>}
                        {task.milestone && <span className="rounded-full bg-[#FFF8EA] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#FFB347]">Milestone</span>}
                      </div>
                      <p className="text-xs text-[#6B7280] mt-0.5">{task.description}</p>
                    </div>
                    <span className="text-sm font-bold text-[#6D5DF6] shrink-0">{task.pts}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* History */}
          {ledger.length > 0 && (
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] px-1">History</p>
              <div className="rounded-3xl border border-[#E5E7EB] bg-white overflow-hidden">
                {ledger.slice(0, 15).map((event, idx) => (
                  <div key={event.id} className={`flex items-center justify-between px-4 py-3 ${idx < Math.min(ledger.length, 15) - 1 ? 'border-b border-[#F3F4F6]' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${event.type === 'bonus' ? 'bg-[#FFF8EA] text-[#FFB347]' : 'bg-[#EDEBFF] text-[#6D5DF6]'}`}>
                        {event.type === 'bonus' ? <Gift className="h-4 w-4" /> : <Flame className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1C1C1E]">{event.label}</p>
                        <p className="text-xs text-[#9CA3AF]">{new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#6D5DF6]">+{event.points}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
