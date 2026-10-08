"use client";

/**
 * usePoints — on-chain points ledger via SettleXPoints contract on Arc Mainnet.
 *
 * Reads: getUserRecord(), canCheckIn() — free, no gas.
 * Writes: checkIn() — user signs tx, pays 0.01 USDC fee + gas.
 *
 * Contract: 0xaf75c1b6EDeE3Cf03FF1282145dD7878EcFfB7B0 (Arc Mainnet)
 * USDC:     0x3600000000000000000000000000000000000000 (Arc Mainnet, 6 decimals)
 */

import { useCallback, useEffect, useState } from 'react';
import { useWallet } from '@/context/WalletContext';

// ─── Constants ────────────────────────────────────────────────────────────────

export const SETTLEX_POINTS_ADDRESS = '0xaf75c1b6EDeE3Cf03FF1282145dD7878EcFfB7B0' as const;
export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as const;
export const ARC_MAINNET_CHAIN_ID = 5042;
export const CHECK_IN_FEE = BigInt(10000); // 0.01 USDC in 6 decimals

/** Points awarded per day in the 7-day weekly cycle (index 0 = Day 1) */
export const WEEKLY_REWARDS = [5, 6, 7, 8, 9, 10, 15] as const;
export const GRAND_PRIZE_30 = 45;
export const GRAND_PRIZE_STREAK = 30;

// ─── Minimal ABIs ─────────────────────────────────────────────────────────────

const POINTS_ABI = [
  {
    name: 'getUserRecord',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'totalPoints', type: 'uint256' },
          { name: 'streak', type: 'uint256' },
          { name: 'lastCheckInTimestamp', type: 'uint256' },
          { name: 'weekCycleDay', type: 'uint256' },
          { name: 'weeksCompleted', type: 'uint256' },
          { name: 'consecutiveDays', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'canCheckIn',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'checkInFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'checkIn',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const;

const ERC20_ABI = [
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnChainRecord {
  totalPoints: number;
  streak: number;
  lastCheckInTimestamp: number; // unix seconds
  weekCycleDay: number;         // 0-6
  weeksCompleted: number;
  consecutiveDays: number;
}

export type CheckInStatus =
  | 'idle'
  | 'loading'
  | 'approving'
  | 'confirming'
  | 'success'
  | 'error';

// ─── RPC helper ───────────────────────────────────────────────────────────────

const ARC_RPC = 'https://rpc.mainnet.arc.io';

async function ethCall(to: string, data: string): Promise<string> {
  const res = await fetch(ARC_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to, data }, 'latest'],
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result as string;
}

// Minimal ABI encoding/decoding (no viem dependency — works in both server and client)
function encodeSelector(sig: string): string {
  // keccak256 first 4 bytes — we precompute for our specific functions
  const selectors: Record<string, string> = {
    'getUserRecord(address)': '0x67e2efc6',
    'canCheckIn(address)':    '0xfb896848',
    'checkInFee()':           '0x9aff62aa',
    'checkIn()':              '0x183ff085',
    'allowance(address,address)': '0xdd62ed3e',
    'approve(address,uint256)':   '0x095ea7b3',
  };
  return selectors[sig] ?? sig;
}

function encodeAddress(addr: string): string {
  return addr.replace('0x', '').padStart(64, '0');
}

function encodeUint256(n: bigint): string {
  return n.toString(16).padStart(64, '0');
}

function decodeUint256(hex: string, offset = 0): bigint {
  return BigInt('0x' + hex.slice(2 + offset * 64, 2 + offset * 64 + 64));
}

async function readUserRecord(address: string): Promise<OnChainRecord> {
  const data = encodeSelector('getUserRecord(address)') + encodeAddress(address);
  const result = await ethCall(SETTLEX_POINTS_ADDRESS, data);
  // struct returns 6 uint256 slots
  return {
    totalPoints:          Number(decodeUint256(result, 0)),
    streak:               Number(decodeUint256(result, 1)),
    lastCheckInTimestamp: Number(decodeUint256(result, 2)),
    weekCycleDay:         Number(decodeUint256(result, 3)),
    weeksCompleted:       Number(decodeUint256(result, 4)),
    consecutiveDays:      Number(decodeUint256(result, 5)),
  };
}

async function readCanCheckIn(address: string): Promise<boolean> {
  const data = encodeSelector('canCheckIn(address)') + encodeAddress(address);
  const result = await ethCall(SETTLEX_POINTS_ADDRESS, data);
  return decodeUint256(result, 0) !== BigInt(0);
}

async function readAllowance(owner: string): Promise<bigint> {
  const data = encodeSelector('allowance(address,address)') +
    encodeAddress(owner) +
    encodeAddress(SETTLEX_POINTS_ADDRESS);
  const result = await ethCall(USDC_ADDRESS, data);
  return decodeUint256(result, 0);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePoints() {
  const { walletAddress, walletProvider, isConnected, chainId, switchToArcMainnet } = useWallet();

  const [record, setRecord] = useState<OnChainRecord | null>(null);
  const [canCheckInNow, setCanCheckInNow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus>('idle');
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [needsChainSwitch, setNeedsChainSwitch] = useState(false);

  // Derived: is wallet on Arc Mainnet?
  const isOnArcMainnet = chainId != null &&
    (chainId.toLowerCase() === '0x13b2' || chainId === '5042');

  // Load on-chain state when wallet connects
  const refresh = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    try {
      const [rec, canCI] = await Promise.all([
        readUserRecord(walletAddress),
        readCanCheckIn(walletAddress),
      ]);
      setRecord(rec);
      setCanCheckInNow(canCI);
    } catch (err) {
      console.error('usePoints refresh error', err);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (isConnected && walletAddress) {
      refresh();
    } else {
      setRecord(null);
      setCanCheckInNow(false);
    }
  }, [isConnected, walletAddress, refresh]);

  /**
   * Perform a daily check-in:
   * 1. Check USDC allowance — if insufficient, send approve tx first.
   * 2. Call checkIn() on the contract.
   * 3. Refresh on-chain state.
   */
  const doCheckIn = useCallback(async () => {
    if (!walletAddress || !walletProvider || !canCheckInNow) return;

    setCheckInStatus('loading');
    setCheckInError(null);
    setNeedsChainSwitch(false);

    try {
      // Step 0 — Ensure wallet is on Arc Mainnet
      if (!isOnArcMainnet) {
        setNeedsChainSwitch(true);
        const result = await switchToArcMainnet();
        if (!result.ok) {
          setCheckInStatus('error');
          setCheckInError('Please switch to Arc Mainnet to check in.');
          return;
        }
        setNeedsChainSwitch(false);
      }

      // Step 1 — Check allowance
      const allowance = await readAllowance(walletAddress);
      if (allowance < CHECK_IN_FEE) {
        setCheckInStatus('approving');
        // Approve exact fee only — MetaMask shows exactly 0.01 USDC, no surprises
        const approveAmount = CHECK_IN_FEE; // 10000 = 0.01 USDC in 6 decimals
        // encodeSelector already returns '0x...' — concatenate raw hex without extra '0x'
        const approveSelector = encodeSelector('approve(address,uint256)'); // '0x095ea7b3'
        const approveData = approveSelector +
          encodeAddress(SETTLEX_POINTS_ADDRESS) +
          encodeUint256(approveAmount);
        // approveData is already '0x...' — pass directly, no extra '0x' prefix

        const approveTx = await walletProvider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: walletAddress,
            to: USDC_ADDRESS,
            data: approveData,
          }],
        }) as string;

        // Wait for approve to be mined
        await waitForTx(approveTx, walletProvider);
      }

      // Step 2 — Call checkIn()
      // encodeSelector returns '0x183ff085' — pass directly, no extra '0x' prefix
      setCheckInStatus('confirming');
      const checkInData = encodeSelector('checkIn()'); // already '0x...'
      const txHash = await walletProvider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress,
          to: SETTLEX_POINTS_ADDRESS,
          data: checkInData,
        }],
      }) as string;

      await waitForTx(txHash, walletProvider);
      setLastTxHash(txHash);
      setCheckInStatus('success');

      // Step 3 — Refresh state
      await refresh();

      // Reset status after 4 seconds
      setTimeout(() => setCheckInStatus('idle'), 4000);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transaction failed';
      // User rejected
      if (msg.includes('rejected') || msg.includes('denied') || msg.includes('cancelled')) {
        setCheckInStatus('idle');
      } else {
        setCheckInStatus('error');
        setCheckInError(msg);
      }
      console.error('checkIn error', err);
    }
  }, [walletAddress, walletProvider, canCheckInNow, isOnArcMainnet, switchToArcMainnet, refresh]);

  // Derived from on-chain record — same shape as old hook so UI components don't change
  const total              = record?.totalPoints ?? 0;
  const streak             = record?.streak ?? 0;
  const cycleDay           = record?.weekCycleDay ?? 0;
  const consecutiveDays    = record?.consecutiveDays ?? 0;
  const todayPoints        = WEEKLY_REWARDS[cycleDay] ?? 5;
  const completedWeeklyDays = cycleDay; // weekCycleDay is 0-indexed next slot; completed = cycleDay days done

  // Reconstruct weeklyDays boolean[] from weekCycleDay (days 0..cycleDay-1 are done this cycle)
  const weeklyDays: boolean[] = WEEKLY_REWARDS.map((_, i) => i < cycleDay);

  const grandPrizeProgress = Math.min(consecutiveDays, GRAND_PRIZE_STREAK);

  // lastCheckinDate as YYYY-MM-DD from unix timestamp
  const lastCheckinDate = record?.lastCheckInTimestamp
    ? new Date(record.lastCheckInTimestamp * 1000).toISOString().slice(0, 10)
    : '';

  // Legacy: empty ledger (on-chain events replace this; history shown from contract events)
  const ledger: never[] = [];

  return {
    // State
    total,
    streak,
    lastCheckinDate,
    weeklyDays,
    ledger,
    record,
    isLoading,
    // Derived
    isCheckInAvailable: canCheckInNow,
    cycleDay,
    todayPoints,
    completedWeeklyDays,
    isWeeklyCycleComplete: cycleDay === 0 && (record?.weeksCompleted ?? 0) > 0,
    grandPrizeProgress,
    consecutiveDays,
    // Check-in action
    doCheckIn,
    checkInStatus,
    checkInError,
    lastTxHash,
    refresh,
    isOnArcMainnet,
    needsChainSwitch,
    // Legacy
    awardTaskPoints: () => {},
  };
}

// ─── Wait for tx receipt ──────────────────────────────────────────────────────

async function waitForTx(
  txHash: string,
  provider: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> },
  maxWaitMs = 60000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const receipt = await provider.request({
      method: 'eth_getTransactionReceipt',
      params: [txHash],
    });
    if (receipt) return;
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error('Transaction timed out waiting for receipt');
}
