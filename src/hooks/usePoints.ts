"use client";

/**
 * usePoints — frontend-only points ledger.
 *
 * Architecture is ledger-event based so a future backend can replace
 * localStorage persistence without rewriting the UI.
 *
 * Ledger event shape (matches future backend schema):
 * {
 *   id: string          — uuid-style
 *   type: 'checkin' | 'task' | 'bonus'
 *   taskId: string      — e.g. 'daily_checkin', 'send_usdc', 'grand_prize_30'
 *   points: number
 *   streakDay?: number  — 1–7 for weekly, 1–30 for monthly
 *   streakCount?: number
 *   timestamp: number   — ms since epoch
 *   ref?: string        — future: tx hash, action id, etc.
 * }
 */

import { useCallback, useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LedgerEventType = 'checkin' | 'task' | 'bonus';

export interface LedgerEvent {
  id: string;
  type: LedgerEventType;
  taskId: string;
  points: number;
  streakDay?: number;
  streakCount?: number;
  timestamp: number;
  ref?: string;
  label: string;
}

export interface PointsState {
  total: number;
  streak: number;           // current consecutive daily check-in streak
  lastCheckinDate: string;  // 'YYYY-MM-DD' of most recent check-in
  weeklyDays: boolean[];    // [0..6] — which days of the current 7-day cycle are done
  ledger: LedgerEvent[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Points awarded per day in the 7-day weekly cycle (index 0 = Day 1) */
export const WEEKLY_REWARDS = [5, 6, 7, 8, 9, 10, 15] as const;

/** Grand prize for 30 consecutive days */
export const GRAND_PRIZE_30 = 45;
export const GRAND_PRIZE_STREAK = 30;

const STORAGE_KEY = 'settlex_points_v1';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyState(): PointsState {
  return {
    total: 0,
    streak: 0,
    lastCheckinDate: '',
    weeklyDays: Array(7).fill(false),
    ledger: [],
  };
}

function load(): PointsState {
  if (typeof window === 'undefined') return emptyState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    return JSON.parse(raw) as PointsState;
  } catch {
    return emptyState();
  }
}

function save(state: PointsState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePoints() {
  const [state, setState] = useState<PointsState>(emptyState);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setState(load());
  }, []);

  /** Whether today's check-in is available (not yet done today) */
  const canCheckInToday = useCallback((s: PointsState): boolean => {
    return s.lastCheckinDate !== todayStr();
  }, []);

  const isCheckInAvailable = canCheckInToday(state);

  /**
   * Which day in the 7-day cycle would the NEXT check-in land on (0-indexed).
   * After a completed 7-day cycle, resets to day 0.
   */
  const nextCycleDay = useCallback((s: PointsState): number => {
    const completedDays = s.weeklyDays.filter(Boolean).length;
    // If all 7 done, next check-in starts a new cycle
    return completedDays % 7;
  }, []);

  /** Perform today's daily check-in */
  const doCheckIn = useCallback(() => {
    setState(prev => {
      if (!canCheckInToday(prev)) return prev; // guard double-tap

      const today = todayStr();
      const wasYesterday = prev.lastCheckinDate === yesterday();
      const newStreak = wasYesterday ? prev.streak + 1 : 1;

      // Determine weekly cycle day
      const cycleDay = prev.weeklyDays.filter(Boolean).length % 7;
      const pts = WEEKLY_REWARDS[cycleDay];

      // Reset weekly cycle if all 7 completed
      const prevWeeklyDone = prev.weeklyDays.filter(Boolean).length;
      const weeklyDays: boolean[] = prevWeeklyDone === 7
        ? Array(7).fill(false)
        : [...prev.weeklyDays];
      weeklyDays[cycleDay] = true;

      const event: LedgerEvent = {
        id: uid(),
        type: 'checkin',
        taskId: 'daily_checkin',
        points: pts,
        streakDay: cycleDay + 1,
        streakCount: newStreak,
        timestamp: Date.now(),
        label: `Day ${cycleDay + 1} check-in`,
      };

      const events: LedgerEvent[] = [event];

      // 30-day grand prize
      let grandPrizeEvent: LedgerEvent | null = null;
      if (newStreak === GRAND_PRIZE_STREAK) {
        grandPrizeEvent = {
          id: uid(),
          type: 'bonus',
          taskId: 'grand_prize_30',
          points: GRAND_PRIZE_30,
          streakCount: newStreak,
          timestamp: Date.now(),
          label: '30-Day Streak Grand Prize 🏆',
        };
        events.push(grandPrizeEvent);
      }

      const totalAdded = pts + (grandPrizeEvent?.points ?? 0);

      const next: PointsState = {
        total: prev.total + totalAdded,
        streak: newStreak,
        lastCheckinDate: today,
        weeklyDays,
        ledger: [...events, ...prev.ledger].slice(0, 200), // cap ledger
      };

      save(next);
      return next;
    });
  }, [canCheckInToday]);

  /** Award points from a task (for future use) */
  const awardTaskPoints = useCallback((taskId: string, points: number, label: string, ref?: string) => {
    setState(prev => {
      const event: LedgerEvent = {
        id: uid(),
        type: 'task',
        taskId,
        points,
        timestamp: Date.now(),
        label,
        ref,
      };
      const next: PointsState = {
        ...prev,
        total: prev.total + points,
        ledger: [event, ...prev.ledger].slice(0, 200),
      };
      save(next);
      return next;
    });
  }, []);

  // Derived
  const cycleDay = nextCycleDay(state);
  const todayPoints = WEEKLY_REWARDS[cycleDay];
  const completedWeeklyDays = state.weeklyDays.filter(Boolean).length;
  const isNewCycle = completedWeeklyDays === 7;

  return {
    // State
    total: state.total,
    streak: state.streak,
    lastCheckinDate: state.lastCheckinDate,
    weeklyDays: state.weeklyDays,
    ledger: state.ledger,
    // Derived
    isCheckInAvailable,
    cycleDay,           // 0-indexed day of current cycle
    todayPoints,        // points for today's check-in
    completedWeeklyDays: isNewCycle ? 7 : completedWeeklyDays,
    isWeeklyCycleComplete: isNewCycle,
    // Actions
    doCheckIn,
    awardTaskPoints,
  };
}
