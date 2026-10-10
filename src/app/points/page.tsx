"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Flame, Trophy, CheckCircle2, Circle,
  Zap, ArrowUpRight, Users, Repeat2, ExternalLink, Loader2,
  MessageCircle, Link2, Copy, Check,
} from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { usePoints, WEEKLY_REWARDS, GRAND_PRIZE_30, GRAND_PRIZE_STREAK } from '@/hooks/usePoints';
import { useWallet } from '@/context/WalletContext';

const BLUE = 'text-[#3B82F6] bg-[#EFF6FF]';

export default function PointsPage() {
  const {
    total, streak, weeklyDays, isCheckInAvailable, cycleDay, todayPoints,
    completedWeeklyDays, grandPrizeProgress, checkInStatus, doCheckIn, isLoading,
    doClaimContactTask, doClaimServerTask, doClaimTwitterTask, doClaimReferral,
    taskStatus, taskError, hasBeenReferred, referralCount, refresh,
  } = usePoints();
  const { walletAddress, isConnected } = useWallet();

  const [checkedIn, setCheckedIn] = useState(false);
  const [copied, setCopied] = useState(false);

  // today key: YYYY-MM-DD — resets state at midnight
  const todayKey = new Date().toISOString().slice(0, 10);

  // Visited tasks — per wallet + day
  const visitedStorageKey = walletAddress
    ? `settlex_visited_${walletAddress.toLowerCase()}_${todayKey}`
    : `settlex_visited_anon_${todayKey}`;

  const [visitedTasks, setVisitedTasks] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem(visitedStorageKey) || '{}'); } catch { return {}; }
  });

  // Claimed tasks — per wallet + day (survives refresh)
  const claimedStorageKey = walletAddress
    ? `settlex_claimed_${walletAddress.toLowerCase()}_${todayKey}`
    : `settlex_claimed_anon_${todayKey}`;

  const [claimedTasks, setClaimedTasks] = useState<Record<string, 'success' | 'pending_review'>>(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem(claimedStorageKey) || '{}'); } catch { return {}; }
  });

  // Reload from correct key when wallet changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      setVisitedTasks(JSON.parse(localStorage.getItem(visitedStorageKey) || '{}'));
      setClaimedTasks(JSON.parse(localStorage.getItem(claimedStorageKey) || '{}'));
    } catch { /* silent */ }
  }, [visitedStorageKey, claimedStorageKey]);

  const markVisited = (taskId: string) => {
    setVisitedTasks(prev => {
      const next = { ...prev, [taskId]: true };
      localStorage.setItem(visitedStorageKey, JSON.stringify(next));
      return next;
    });
  };

  const markClaimed = (taskId: string, state: 'success' | 'pending_review') => {
    setClaimedTasks(prev => {
      const next = { ...prev, [taskId]: state };
      localStorage.setItem(claimedStorageKey, JSON.stringify(next));
      return next;
    });
  };

  const referralLink = walletAddress
    ? `https://www.settlex.click/r/${walletAddress.toLowerCase()}`
    : '';

  // Auto-claim referral on first connect if stored
  const autoClaim = useCallback(async () => {
    if (!isConnected || !walletAddress || hasBeenReferred) return;
    try {
      const referrer = localStorage.getItem('settlex_referrer');
      if (referrer && referrer.toLowerCase() !== walletAddress.toLowerCase()) {
        await doClaimReferral(referrer);
        localStorage.removeItem('settlex_referrer');
      }
    } catch { /* silent */ }
  }, [isConnected, walletAddress, hasBeenReferred, doClaimReferral]);

  useEffect(() => { autoClaim(); }, [autoClaim]);

  const handleCheckIn = async () => {
    if (!isCheckInAvailable) return;
    await doCheckIn();
    setCheckedIn(true);
    setTimeout(() => setCheckedIn(false), 3000);
  };

  const handleCopyReferral = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const grandPrizePct = Math.round((grandPrizeProgress / GRAND_PRIZE_STREAK) * 100);

  // ─── Task card definitions ──────────────────────────────────────────────────
  // Merge live taskStatus with persisted claimedTasks — persisted wins after refresh
  const resolveStatus = (id: string) => {
    const live = taskStatus[id];
    const persisted = claimedTasks[id];
    if (live === 'loading') return 'loading';
    if (persisted === 'success') return 'success';
    if (persisted === 'pending_review') return 'pending_review';
    return live ?? 'idle';
  };

  const TASKS = [
    {
      id: 'TASK_TWITTER',
      icon: MessageCircle,
      label: 'Engage on X',
      description: 'Reply and repost the latest Settle Exchange tweet.',
      pts: 15,
      visitUrl: 'https://x.com/Settle_xchange/status/2108646781496271089',
      visitLabel: 'View Tweet',
      status: resolveStatus('TASK_TWITTER'),
      error: taskError['TASK_TWITTER'],
      onClaim: async () => { await doClaimTwitterTask(); markClaimed('TASK_TWITTER', 'pending_review'); },
      successMsg: 'Submitted for review — points awarded within 24h',
      pendingMsg: 'Pending review — points awarded within 24h',
      dailyMax: '1×/day',
      badge: 'Manual Review',
    },
    {
      id: 'TASK_CONTACT',
      icon: Users,
      label: 'Add a Contact',
      description: 'Save a new contact with a wallet address.',
      pts: 5,
      visitUrl: '/contacts/add',
      visitLabel: 'Add Contact',
      status: resolveStatus('TASK_CONTACT'),
      error: taskError['TASK_CONTACT'],
      onClaim: async () => { await doClaimContactTask(); markClaimed('TASK_CONTACT', 'success'); },
      successMsg: '+5 pts awarded!',
      pendingMsg: '',
      dailyMax: '1×/day',
      badge: 'Daily',
    },
    {
      id: 'TASK_SWAP',
      icon: Repeat2,
      label: 'Swap Assets',
      description: 'Swap any supported tokens on Arc Mainnet.',
      pts: 10,
      visitUrl: '/swap',
      visitLabel: 'Swap Now',
      status: resolveStatus('TASK_SWAP'),
      error: taskError['TASK_SWAP'],
      onClaim: async () => { await doClaimServerTask('TASK_SWAP'); markClaimed('TASK_SWAP', 'success'); },
      successMsg: '+10 pts awarded!',
      pendingMsg: '',
      dailyMax: '3×/day',
      badge: 'Daily',
    },
    {
      id: 'TASK_SEND',
      icon: ArrowUpRight,
      label: 'Send USDC',
      description: 'Send USDC to a contact or wallet address on Arc Mainnet.',
      pts: 8,
      visitUrl: '/send',
      visitLabel: 'Send Now',
      status: resolveStatus('TASK_SEND'),
      error: taskError['TASK_SEND'],
      onClaim: async () => { await doClaimServerTask('TASK_SEND'); markClaimed('TASK_SEND', 'success'); },
      successMsg: '+8 pts awarded!',
      pendingMsg: '',
      dailyMax: '2×/day',
      badge: 'Daily',
    },
  ];

  // ─── Task card component ──────────────────────────────────────────────────
  const TaskCard = ({ task }: { task: typeof TASKS[0] }) => {
    const Icon = task.icon;
    const isBusy = task.status === 'loading';
    const isDone = task.status === 'success';
    const isPending = task.status === 'pending_review';
    const isLocked = isDone || isPending;
    const hasVisited = visitedTasks[task.id] ?? false;
    const canClaim = hasVisited && isConnected && !isBusy && !isLocked;
    const isExternal = task.visitUrl.startsWith('http');

    const visitBtn = isExternal ? (
      <a
        href={task.visitUrl}
        target="_blank"
        rel="noreferrer"
        onClick={() => markVisited(task.id)}
        className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
          hasVisited
            ? 'border-[#3B82F6] bg-[#EFF6FF] text-[#3B82F6]'
            : 'border-[#E5E7EB] bg-[#F9FAFB] text-[#374151] hover:bg-[#F3F4F6]'
        }`}
      >
        {hasVisited ? <Check className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
        {task.visitLabel}
      </a>
    ) : (
      <Link
        href={task.visitUrl}
        onClick={() => markVisited(task.id)}
        className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
          hasVisited
            ? 'border-[#3B82F6] bg-[#EFF6FF] text-[#3B82F6]'
            : 'border-[#E5E7EB] bg-[#F9FAFB] text-[#374151] hover:bg-[#F3F4F6]'
        }`}
      >
        {hasVisited ? <Check className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
        {task.visitLabel}
      </Link>
    );

    return (
      <div className="rounded-3xl border border-[#E5E7EB] bg-white p-4 shadow-[0_4px_12px_rgba(17,24,39,0.04)]">
        <div className="flex items-start gap-3 mb-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${BLUE}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-semibold text-[#1C1C1E] text-sm">{task.label}</span>
              <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#3B82F6]">
                {task.badge}
              </span>
              <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[9px] font-semibold text-[#9CA3AF]">
                {task.dailyMax}
              </span>
            </div>
            <p className="text-xs text-[#6B7280]">{task.description}</p>
            {isDone && (
              <p className="text-xs text-[#22C55E] font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />{task.successMsg}
              </p>
            )}
            {isPending && (
              <p className="text-xs text-[#F59E0B] font-semibold mt-1 flex items-center gap-1">
                <Loader2 className="h-3.5 w-3.5" />{task.pendingMsg}
              </p>
            )}
            {task.status === 'error' && task.error && (
              <p className="text-xs text-red-500 mt-1 leading-tight">{task.error}</p>
            )}
          </div>
          <span className="text-sm font-bold text-[#3B82F6] shrink-0">+{task.pts} pts</span>
        </div>
        <div className="flex items-center gap-2">
          {visitBtn}
          <button
            onClick={task.onClaim}
            disabled={!canClaim}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
              isDone
                ? 'bg-[#DCFCE7] text-[#16A34A] cursor-default'
                : isPending
                ? 'bg-[#FEF3C7] text-[#92400E] cursor-default'
                : isBusy
                ? 'bg-[#EFF6FF] text-[#3B82F6] cursor-wait'
                : !isConnected
                ? 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed'
                : !hasVisited
                ? 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed'
                : 'bg-[#6D5DF6] text-white hover:bg-[#5a4de0] active:scale-[0.98]'
            }`}
          >
            {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isDone
              ? 'Claimed!'
              : isPending
              ? 'Pending Review'
              : isBusy
              ? 'Verifying…'
              : !isConnected
              ? 'Connect Wallet'
              : !hasVisited
              ? 'Visit first'
              : 'Claim Points'}
          </button>
        </div>
      </div>
    );
  };

  // ─── Left column ─────────────────────────────────────────────────────────
  const leftCol = (
    <div className="w-full px-4 py-5 pb-28 lg:pb-6 lg:px-6 space-y-4 lg:overflow-y-auto lg:h-full">

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-[#EFF6FF] border border-[#BFDBFE] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3B82F6] mb-1">Total Points</p>
          <p className="text-4xl font-bold text-[#1E3A5F]">{total.toLocaleString()}</p>
          <p className="text-[11px] text-[#6B7280] mt-1">Settle Exchange</p>
        </div>
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
        <div className="grid grid-cols-7 gap-1.5 mb-4">
          {WEEKLY_REWARDS.map((pts, i) => {
            const done = weeklyDays[i];
            const isToday = !done && i === cycleDay && isCheckInAvailable;
            return (
              <div key={i} className={`flex flex-col items-center gap-1 rounded-2xl py-2 border transition-all ${
                done ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                : isToday ? 'bg-[#EFF6FF] border-[#3B82F6] text-[#3B82F6]'
                : 'bg-[#F5F6F8] border-[#E5E7EB] text-[#9CA3AF]'}`}
              >
                <span className="text-[8px] font-bold uppercase">{['M','T','W','T','F','S','S'][i]}</span>
                <span className="text-[10px] font-bold">{i === 6 ? '🏆' : `+${pts}`}</span>
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
          <div className="h-full rounded-full bg-[#3B82F6] transition-all duration-500" style={{ width: `${grandPrizePct}%` }} />
        </div>
        <p className="text-xs text-[#6B7280]">
          {grandPrizeProgress} / {GRAND_PRIZE_STREAK} consecutive days
          {grandPrizeProgress >= GRAND_PRIZE_STREAK ? ' — 🏆 Unlocked!' : ` — ${GRAND_PRIZE_STREAK - grandPrizeProgress} more to go`}
        </p>
      </div>

      {/* Referral card */}
      <div className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-[0_8px_24px_rgba(17,24,39,0.06)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#3B82F6]" />
            <span className="font-semibold text-[#1C1C1E]">Refer a Friend</span>
          </div>
          <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-sm font-bold text-[#3B82F6]">+10 pts</span>
        </div>
        <p className="text-xs text-[#6B7280] mb-3">
          Share your link. When a friend joins and checks in, you earn 10 pts — they earn 5 pts.
          {referralCount > 0 && <span className="ml-1 font-semibold text-[#3B82F6]">{referralCount} referral{referralCount !== 1 ? 's' : ''} so far.</span>}
        </p>
        {walletAddress ? (
          <div className="flex items-center gap-2 rounded-2xl bg-[#F5F6F8] border border-[#E5E7EB] px-3 py-2">
            <Link2 className="h-4 w-4 text-[#6B7280] shrink-0" />
            <span className="flex-1 text-xs text-[#374151] truncate font-mono">{referralLink}</span>
            <button
              onClick={handleCopyReferral}
              className="shrink-0 flex items-center gap-1 rounded-xl bg-[#6D5DF6] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#5a4de0] transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        ) : (
          <p className="text-xs text-[#9CA3AF]">Connect your wallet to get your referral link.</p>
        )}
      </div>

      {/* Mobile history link */}
      <div className="lg:hidden flex flex-col items-center justify-center rounded-3xl border border-[#E5E7EB] bg-white py-8 text-center shadow-sm">
        <Circle className="h-8 w-8 text-[#BFDBFE] mb-2" />
        <p className="text-sm font-semibold text-[#1C1C1E]">On-chain history</p>
        <p className="text-xs text-[#6B7280] mt-1">Your check-in history lives on Arc Mainnet.</p>
        <a href="/transactions" className="mt-3 text-xs font-semibold text-[#3B82F6] underline">View Activity tab</a>
      </div>
    </div>
  );

  // ─── Right column: tasks ──────────────────────────────────────────────────
  const rightCol = (
    <div className="hidden lg:block lg:overflow-y-auto lg:h-full px-6 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280]">Tasks</p>
        <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[10px] font-semibold text-[#3B82F6] uppercase tracking-wide">Earn Points</span>
      </div>
      <div className="space-y-3">
        {TASKS.map(task => <TaskCard key={task.id} task={task} />)}
      </div>
      {/* History */}
      <div className="flex flex-col items-center justify-center rounded-3xl border border-[#E5E7EB] bg-white py-8 text-center shadow-sm">
        <Circle className="h-8 w-8 text-[#BFDBFE] mb-2" />
        <p className="text-sm font-semibold text-[#1C1C1E]">On-chain history</p>
        <p className="text-xs text-[#6B7280] mt-1">Check-in history lives permanently on Arc Mainnet.</p>
        <a href="/transactions" className="mt-3 text-xs font-semibold text-[#3B82F6] underline">View Activity tab</a>
      </div>
    </div>
  );

  // Mobile tasks section
  const mobileTasksSection = (
    <div className="lg:hidden px-4 pb-8 space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280] px-1">Tasks</p>
      {TASKS.map(task => <TaskCard key={task.id} task={task} />)}
    </div>
  );

  return (
    <PageLayout fullWidth>
      <div className="w-full lg:h-[calc(100dvh-65px)] lg:grid lg:grid-cols-2 lg:gap-0">
        <div className="lg:border-r lg:border-[#E5E7EB] lg:overflow-y-auto">
          {leftCol}
          {mobileTasksSection}
        </div>
        {rightCol}
      </div>
    </PageLayout>
  );
}
