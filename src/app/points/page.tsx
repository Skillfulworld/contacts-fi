"use client";

import { useState } from 'react';
import {
  Flame, Trophy, Star, CheckCircle2, Circle,
  Zap, ArrowUpRight, Users, Repeat2, ExternalLink, Loader2,
} from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { usePoints, WEEKLY_REWARDS, GRAND_PRIZE_30, GRAND_PRIZE_STREAK } from '@/hooks/usePoints';

// Single blue tone for all icons
const BLUE = 'text-[#3B82F6] bg-[#EFF6FF]';

// ─── Coming-soon placeholder tasks ─────────────────────────────────────────────
const PLACEHOLDER_TASKS = [
  {
    id: 'send_usdc',
    icon: ArrowUpRight,
    label: 'Send USDC',
    description: 'Send USDC to a saved contact on Arc Mainnet.',
    pts: 10,
  },
  {
    id: 'bridge_usdc',
    icon: Zap,
    label: 'Bridge USDC',
    description: 'Bridge USDC across chains using Circle CCTP.',
    pts: 15,
  },
  {
    id: 'add_contact',
    icon: Users,
    label: 'Add a Contact',
    description: 'Save a new contact with a wallet address.',
    pts: 5,
  },
  {
    id: 'swap_assets',
    icon: Repeat2,
    label: 'Swap Assets',
    description: 'Swap supported tokens on Arc Mainnet.',
    pts: 10,
  },
  {
    id: 'refer_friend',
    icon: Star,
    label: 'Refer a Friend',
    description: 'Invite a friend to join Settle Exchange.',
    pts: 25,
  },
  {
    id: 'grand_streak',
    icon: Trophy,
    label: '30-Day Streak',
    description: `Maintain a 30-day consecutive check-in streak for a grand prize.`,
    pts: GRAND_PRIZE_30,
    isMilestone: true,
  },
];

export default function PointsPage() {
  const {
    total,
    streak,
    weeklyDays,
    isCheckInAvailable,
    cycleDay,
    todayPoints,
    completedWeeklyDays,
    grandPrizeProgress,
    checkInStatus,
    doCheckIn,
    isLoading,
  } = usePoints();

  const [checkedIn, setCheckedIn] = useState(false);

  const handleCheckIn = async () => {
    if (!isCheckInAvailable) return;
    await doCheckIn();
    setCheckedIn(true);
    setTimeout(() => setCheckedIn(false), 3000);
  };
  const grandPrizePct = Math.round((grandPrizeProgress / GRAND_PRIZE_STREAK) * 100);

  // ─── Left column: check-in + history (mobile: full page) ──────────────────
  const leftCol = (
    <div className="w-full px-4 py-5 pb-28 lg:pb-6 lg:px-6 space-y-4 lg:overflow-y-auto lg:h-full">

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Points */}
        <div className="rounded-3xl bg-[#EFF6FF] border border-[#BFDBFE] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3B82F6] mb-1">Total Points</p>
          <p className="text-4xl font-bold text-[#1E3A5F]">{total.toLocaleString()}</p>
          <p className="text-[11px] text-[#6B7280] mt-1">Settle Exchange</p>
        </div>
        {/* Streak — light card, no black */}
        <div className="rounded-3xl bg-[#F0F9FF] border border-[#BAE6FD] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3B82F6] mb-1">Streak</p>
          <div className="flex items-end gap-1">
            <p className="text-4xl font-bold text-[#1E3A5F]">{streak}</p>
            <Flame className="h-6 w-6 text-[#3B82F6] mb-1" />
          </div>
          <p className="text-[11px] text-[#6B7280] mt-1">Consecutive days</p>
        </div>
      </div>

      {/* Weekly check-in */}
      <div className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-[0_8px_24px_rgba(17,24,39,0.06)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] mb-0.5">Weekly Check-in</p>
            <p className="font-semibold text-[#1C1C1E]">{completedWeeklyDays}/7 days complete</p>
          </div>
          {isCheckInAvailable ? (
            <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[11px] font-semibold text-[#3B82F6]">Available</span>
          ) : (
            <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-[11px] font-semibold text-[#6B7280]">Done today</span>
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
                    ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                    : isToday
                    ? 'bg-[#EFF6FF] border-[#3B82F6] text-[#3B82F6]'
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
            disabled={checkInStatus === 'approving' || checkInStatus === 'confirming' || checkInStatus === 'loading' || isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#3B82F6] py-3.5 font-semibold text-white shadow-[0_8px_24px_rgba(59,130,246,0.22)] transition-all active:scale-[0.98] hover:bg-[#2563EB] disabled:opacity-70 disabled:cursor-wait"
          >
            {(checkInStatus === 'approving' || checkInStatus === 'confirming' || checkInStatus === 'loading') && <Loader2 className="h-4 w-4 animate-spin" />}
            {checkedIn ? '✓ Checked in!' : checkInStatus === 'approving' ? 'Approving USDC…' : checkInStatus === 'confirming' ? 'Confirm in wallet…' : `Check in · +${todayPoints} pts`}
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#F3F4F6] py-3 text-sm font-semibold text-[#6B7280]">
            <CheckCircle2 className="h-4 w-4 text-[#3B82F6]" />
            Checked in today — come back tomorrow
          </div>
        )}
      </div>

      {/* 30-day grand prize */}
      <div className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-[0_8px_24px_rgba(17,24,39,0.06)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#3B82F6]" />
            <span className="font-semibold text-[#1C1C1E]">30-Day Grand Prize</span>
          </div>
          <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-sm font-bold text-[#3B82F6]">+{GRAND_PRIZE_30} pts</span>
        </div>
        <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
          <div
            className="h-full rounded-full bg-[#3B82F6] transition-all duration-500"
            style={{ width: `${grandPrizePct}%` }}
          />
        </div>
        <p className="text-xs text-[#6B7280]">
          {grandPrizeProgress} / {GRAND_PRIZE_STREAK} consecutive days
          {streak >= GRAND_PRIZE_STREAK ? ' — 🏆 Unlocked!' : ` — ${GRAND_PRIZE_STREAK - grandPrizeProgress} more to go`}
        </p>
      </div>

      {/* Points history link — full history in Activity tab */}
      <div className="lg:hidden flex flex-col items-center justify-center rounded-3xl border border-[#E5E7EB] bg-white py-8 text-center shadow-sm">
        <Circle className="h-8 w-8 text-[#BFDBFE] mb-2" />
        <p className="text-sm font-semibold text-[#1C1C1E]">On-chain history</p>
        <p className="text-xs text-[#6B7280] mt-1">Your check-in history lives on Arc Mainnet.</p>
        <a href="/transactions" className="mt-3 text-xs font-semibold text-[#3B82F6] underline">View Activity tab</a>
      </div>
    </div>
  );

  // ─── Right column: tasks (desktop only) ───────────────────────────────────
  const rightCol = (
    <div className="hidden lg:block lg:overflow-y-auto lg:h-full px-6 py-5 space-y-4">

      {/* Tasks header */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280]">Tasks</p>
        <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Coming Soon</span>
      </div>

      {/* Placeholder task cards */}
      <div className="space-y-3">
        {PLACEHOLDER_TASKS.map(task => {
          const Icon = task.icon;
          return (
            <div
              key={task.id}
              className="rounded-3xl border border-[#E5E7EB] bg-white p-4 shadow-[0_4px_12px_rgba(17,24,39,0.04)]"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${BLUE}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#1C1C1E] text-sm">{task.label}</span>
                    {task.isMilestone ? (
                      <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#3B82F6]">Milestone</span>
                    ) : (
                      <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Coming Soon</span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5">{task.description}</p>
                </div>
                <span className="text-sm font-bold text-[#3B82F6] shrink-0">+{task.pts} pts</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled
                  className="flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-xs font-semibold text-[#9CA3AF] cursor-not-allowed"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Visit
                </button>
                <button
                  disabled
                  className="flex-1 rounded-xl bg-[#F3F4F6] px-3 py-2 text-xs font-semibold text-[#9CA3AF] cursor-not-allowed"
                >
                  Claim Points
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* History — desktop: link to Activity tab */}
      <div className="flex flex-col items-center justify-center rounded-3xl border border-[#E5E7EB] bg-white py-10 text-center shadow-sm">
        <Circle className="h-8 w-8 text-[#BFDBFE] mb-2" />
        <p className="text-sm font-semibold text-[#1C1C1E]">On-chain history</p>
        <p className="text-xs text-[#6B7280] mt-1">Check-in history lives permanently on Arc Mainnet.</p>
        <a href="/transactions" className="mt-3 text-xs font-semibold text-[#3B82F6] underline">View Activity tab</a>
      </div>
    </div>
  );

  // Mobile also shows tasks below the check-in
  const mobileTasksSection = (
    <div className="lg:hidden px-4 pb-8 space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] px-1">Tasks</p>
      {PLACEHOLDER_TASKS.map(task => {
        const Icon = task.icon;
        return (
          <div key={task.id} className="rounded-3xl border border-[#E5E7EB] bg-white p-4 shadow-[0_4px_12px_rgba(17,24,39,0.04)]">
            <div className="flex items-start gap-3 mb-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${BLUE}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[#1C1C1E] text-sm">{task.label}</span>
                  {task.isMilestone ? (
                    <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#3B82F6]">Milestone</span>
                  ) : (
                    <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Soon</span>
                  )}
                </div>
                <p className="text-xs text-[#6B7280] mt-0.5">{task.description}</p>
              </div>
              <span className="text-sm font-bold text-[#3B82F6] shrink-0">+{task.pts}</span>
            </div>
            <div className="flex items-center gap-2">
              <button disabled className="flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-xs font-semibold text-[#9CA3AF] cursor-not-allowed">
                <ExternalLink className="h-3.5 w-3.5" />Visit
              </button>
              <button disabled className="flex-1 rounded-xl bg-[#F3F4F6] px-3 py-2 text-xs font-semibold text-[#9CA3AF] cursor-not-allowed">
                Claim Points
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <PageLayout fullWidth>
      <div className="w-full lg:h-[calc(100dvh-65px)] lg:grid lg:grid-cols-2 lg:gap-0">
        {/* Left — check-in dashboard */}
        <div className="lg:border-r lg:border-[#E5E7EB] lg:overflow-y-auto">
          {leftCol}
          {mobileTasksSection}
        </div>
        {/* Right — tasks (desktop only) */}
        {rightCol}
      </div>
    </PageLayout>
  );
}
