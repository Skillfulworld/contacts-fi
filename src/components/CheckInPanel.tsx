"use client";

import { useEffect, useRef } from 'react';
import { X, Flame, Trophy, Star, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePoints, WEEKLY_REWARDS, GRAND_PRIZE_30, GRAND_PRIZE_STREAK } from '@/hooks/usePoints';
import { useWallet } from '@/context/WalletContext';

interface CheckInPanelProps {
  onClose: () => void;
}

export default function CheckInPanel({ onClose }: CheckInPanelProps) {
  const { isConnected, connectWallet } = useWallet();
  const {
    total,
    streak,
    weeklyDays,
    isCheckInAvailable,
    cycleDay,
    todayPoints,
    completedWeeklyDays,
    grandPrizeProgress,
    isLoading,
    checkInStatus,
    checkInError,
    lastTxHash,
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

  const grandPrizePct = Math.round((grandPrizeProgress / GRAND_PRIZE_STREAK) * 100);
  const isProcessing = checkInStatus === 'approving' || checkInStatus === 'confirming' || checkInStatus === 'loading';

  const statusLabel = () => {
    if (checkInStatus === 'loading')    return 'Preparing…';
    if (checkInStatus === 'approving')  return 'Approving USDC spend… (1 of 2)';
    if (checkInStatus === 'confirming') return 'Confirm check-in in wallet… (2 of 2)';
    if (checkInStatus === 'success')    return '✓ Checked in!';
    return `Check in · +${todayPoints} pts`;
  };

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
            <Flame className="h-5 w-5 text-[#3B82F6]" />
            <span className="font-semibold text-[#1C1C1E]">Daily Check-in</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#6B7280] hover:bg-[#F3F4F6]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Not connected state */}
        {!isConnected ? (
          <div className="px-5 py-8 text-center">
            <Flame className="h-10 w-10 text-[#3B82F6] mx-auto mb-3" />
            <p className="font-semibold text-[#1C1C1E] mb-1">Connect your wallet</p>
            <p className="text-sm text-[#6B7280] mb-5">Connect to see your on-chain points and check in daily.</p>
            <button
              onClick={() => { connectWallet(); onClose(); }}
              className="w-full rounded-2xl bg-[#3B82F6] py-3 font-semibold text-white hover:bg-[#2563EB] transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#3B82F6]" />
          </div>
        ) : (
          <>
            {/* Points summary */}
            <div className="flex items-center justify-between bg-[#F5F6F8] px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280]">Total Points</p>
                <p className="text-3xl font-bold text-[#1C1C1E]">{total.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280]">Streak</p>
                <div className="flex items-center gap-1 justify-end">
                  <Flame className="h-4 w-4 text-[#3B82F6]" />
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
                          ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                          : isToday
                          ? 'bg-[#EFF6FF] border-[#3B82F6] text-[#3B82F6]'
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
            </div>

            {/* Fee notice */}
            <div className="mx-5 mt-3 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] px-4 py-2.5">
              <p className="text-[11px] text-[#0369A1] leading-relaxed">
                <span className="font-semibold">0.01 USDC platform fee</span> + small gas (USDC) per check-in.
                First check-in requires a one-time USDC approval — you'll see 2 wallet prompts.
              </p>
            </div>

            {/* Error */}
            {checkInStatus === 'error' && checkInError && (
              <div className="mx-5 mt-2 flex items-start gap-2 rounded-2xl bg-red-50 border border-red-100 px-4 py-2.5">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-600">{checkInError}</p>
              </div>
            )}

            {/* Success tx link */}
            {checkInStatus === 'success' && lastTxHash && (
              <div className="mx-5 mt-2 flex items-center gap-2 rounded-2xl bg-green-50 border border-green-100 px-4 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <a
                  href={`https://explorer.arc.io/tx/${lastTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-green-700 underline"
                >
                  View on Arc Explorer
                </a>
              </div>
            )}

            {/* Check-in button */}
            <div className="px-5 py-4">
              {isCheckInAvailable ? (
                <button
                  onClick={doCheckIn}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#3B82F6] py-3.5 font-semibold text-white shadow-[0_8px_24px_rgba(59,130,246,0.22)] transition-all active:scale-[0.98] hover:bg-[#2563EB] disabled:opacity-70 disabled:cursor-wait"
                >
                  {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                  {statusLabel()}
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#F3F4F6] py-3.5 text-sm font-semibold text-[#6B7280]">
                  <Star className="h-4 w-4 text-[#3B82F6]" />
                  Already checked in today
                </div>
              )}
            </div>

            {/* 30-day grand prize progress */}
            <div className="border-t border-[#F3F4F6] px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Trophy className="h-4 w-4 text-[#3B82F6]" />
                  <span className="text-sm font-semibold text-[#1C1C1E]">30-Day Grand Prize</span>
                </div>
                <span className="text-sm font-bold text-[#3B82F6]">+{GRAND_PRIZE_30} pts</span>
              </div>
              <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
                <div
                  className="h-full rounded-full bg-[#3B82F6] transition-all duration-500"
                  style={{ width: `${grandPrizePct}%` }}
                />
              </div>
              <p className="text-[10px] text-[#9CA3AF]">
                {grandPrizeProgress} / {GRAND_PRIZE_STREAK} consecutive days
                {grandPrizeProgress >= GRAND_PRIZE_STREAK ? ' — 🏆 Unlocked!' : ''}
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
