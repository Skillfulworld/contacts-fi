"use client";

import { useEffect, useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { TrendingUp } from 'lucide-react';

// Arc Mainnet token addresses
const TOKENS = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x3600000000000000000000000000000000000000',
    decimals: 6,
    color: '#2775CA',
    usdRate: 1.00,
  },
  {
    symbol: 'EURC',
    name: 'Euro Coin',
    address: '0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1',
    decimals: 6,
    color: '#0052B4',
    usdRate: 1.09, // approximate EUR/USD
  },
  {
    symbol: 'cirBTC',
    name: 'Circle BTC',
    address: '0x1E0049783F008A0085193E00003D00cd54003c71',
    decimals: 8,
    color: '#F7931A',
    usdRate: 65000, // approximate BTC/USD
  },
];

const ARC_RPC = 'https://rpc.mainnet.arc.io';

async function fetchTokenBalance(tokenAddress: string, walletAddress: string, decimals: number): Promise<number> {
  // ERC-20 balanceOf selector: 0x70a08231
  const paddedAddress = walletAddress.slice(2).toLowerCase().padStart(64, '0');
  const data = '0x70a08231' + paddedAddress;
  try {
    const res = await fetch(ARC_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'eth_call',
        params: [{ to: tokenAddress, data }, 'latest'],
      }),
    });
    const json = await res.json();
    if (!json.result || json.result === '0x') return 0;
    const raw = BigInt(json.result);
    return Number(raw) / Math.pow(10, decimals);
  } catch {
    return 0;
  }
}

interface TokenRow {
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  color: string;
  loading: boolean;
}

export default function WalletBalanceCard({ className = '' }: { className?: string }) {
  const { walletAddress, isConnected } = useWallet();
  const [rows, setRows] = useState<TokenRow[]>(
    TOKENS.map(t => ({ symbol: t.symbol, name: t.name, balance: 0, usdValue: 0, color: t.color, loading: true }))
  );
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!isConnected || !walletAddress) {
      setRows(TOKENS.map(t => ({ symbol: t.symbol, name: t.name, balance: 0, usdValue: 0, color: t.color, loading: false })));
      setFetched(false);
      return;
    }
    let cancelled = false;
    async function load() {
      setRows(TOKENS.map(t => ({ symbol: t.symbol, name: t.name, balance: 0, usdValue: 0, color: t.color, loading: true })));
      const results = await Promise.all(
        TOKENS.map(async (t) => {
          const balance = await fetchTokenBalance(t.address, walletAddress!, t.decimals);
          return {
            symbol: t.symbol,
            name: t.name,
            balance,
            usdValue: balance * t.usdRate,
            color: t.color,
            loading: false,
          };
        })
      );
      if (!cancelled) {
        setRows(results);
        setFetched(true);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [walletAddress, isConnected]);

  const totalUsd = rows.reduce((s, r) => s + r.usdValue, 0);
  const hasAny = rows.some(r => r.balance > 0);

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#6D5DF6] via-[#7C6AF7] to-[#8B7CF8] p-6 text-white shadow-lg ${className}`}>
      {/* Subtle background circle */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-white/5" />

      {/* Header */}
      <div className="relative flex items-start justify-between mb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">Balance</p>
          <div className="flex items-baseline gap-2">
            {fetched ? (
              <>
                <span className="text-3xl font-bold tabular-nums" style={{ letterSpacing: '-0.02em' }}>
                  ${totalUsd < 0.01 && totalUsd > 0 ? '<0.01' : totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-sm text-white/60">USD</span>
              </>
            ) : isConnected ? (
              <div className="h-8 w-28 rounded-lg bg-white/20 animate-pulse" />
            ) : (
              <span className="text-lg text-white/50">Connect wallet</span>
            )}
          </div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
      </div>

      {/* Token rows */}
      <div className="relative space-y-3">
        {rows.map((row) => (
          <div key={row.symbol} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Token dot */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: row.color }} />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">{row.symbol}</p>
                <p className="text-xs text-white/50 leading-tight">{row.name}</p>
              </div>
            </div>
            <div className="text-right">
              {row.loading ? (
                <div className="h-4 w-16 rounded bg-white/20 animate-pulse" />
              ) : (
                <>
                  <p className="text-sm font-semibold tabular-nums">
                    {row.balance === 0 && !hasAny && !fetched
                      ? '—'
                      : row.balance.toLocaleString('en-US', {
                          minimumFractionDigits: row.symbol === 'cirBTC' ? 6 : 2,
                          maximumFractionDigits: row.symbol === 'cirBTC' ? 6 : 2,
                        })}
                  </p>
                  {row.usdValue > 0 && (
                    <p className="text-xs text-white/50 tabular-nums">
                      ${row.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
