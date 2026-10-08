"use client";

import { useState, useEffect, useCallback } from 'react';
import { Search, ReceiptText, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';

type TxType = 'send' | 'swap' | 'bridge' | 'checkin' | 'receive' | string;

interface OnchainTx {
  id: string;
  tx_hash: string;
  tx_type: TxType;
  amount: string;
  token_symbol: string;
  from_address: string;
  to_address: string;
  block_timestamp: string;
  metadata: Record<string, unknown>;
}

const TYPE_LABELS: Record<TxType, string> = {
  send:    'Sent',
  receive: 'Received',
  swap:    'Swap',
  bridge:  'Bridge',
  checkin: 'Check-in',
};

const TYPE_COLORS: Record<TxType, string> = {
  send:    'bg-red-50 text-red-600',
  receive: 'bg-green-50 text-green-600',
  swap:    'bg-purple-50 text-purple-600',
  bridge:  'bg-blue-50 text-blue-600',
  checkin: 'bg-[#EFF6FF] text-[#3B82F6]',
};

function shortAddr(addr: string) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatAmount(amount: string, symbol: string) {
  const n = parseFloat(amount);
  if (isNaN(n)) return `— ${symbol}`;
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${symbol}`;
}

export default function TransactionsHistoryPage() {
  const { walletAddress, isConnected } = useWallet();
  const { authHeaders, isSignedIn } = useAuth();

  const [transactions, setTransactions] = useState<OnchainTx[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  const filters = ['All', 'Sent', 'Received', 'Swap', 'Bridge', 'Check-in'];

  const load = useCallback(async () => {
    if (!isSignedIn) return;
    setIsLoading(true);
    try {
      const typeMap: Record<string, string> = {
        Sent: 'send', Received: 'receive', Swap: 'swap', Bridge: 'bridge', 'Check-in': 'checkin',
      };
      const typeParam = filter !== 'All' ? `&type=${typeMap[filter] ?? ''}` : '';
      const res = await fetch(`/api/transactions?limit=30${typeParam}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions ?? []);
      }
    } catch (err) {
      console.error('tx load error', err);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, filter, authHeaders]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const filteredTx = transactions.filter(tx => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return tx.tx_hash.toLowerCase().includes(q) ||
      tx.from_address.toLowerCase().includes(q) ||
      tx.to_address.toLowerCase().includes(q) ||
      tx.tx_type.toLowerCase().includes(q);
  });

  return (
    <PageLayout brandSide="right">
      <div className="bg-[var(--md-sys-color-background)] p-4 pb-24">
        <div className="flex items-center justify-between py-6">
          <h1 className="text-3xl font-semibold text-[var(--md-sys-color-on-background)]">Activity</h1>
          {isSignedIn && (
            <button
              onClick={load}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#6B7280] shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </div>

        {/* Not signed in */}
        {!isConnected && (
          <div className="flex flex-col items-center justify-center rounded-[28px] border border-[#E5E7EB] bg-white py-16 text-center shadow-sm">
            <ReceiptText className="h-10 w-10 text-[#E5E7EB] mb-3" />
            <p className="font-semibold text-[#1C1C1E]">Connect your wallet</p>
            <p className="text-sm text-[#6B7280] mt-1">Connect to see your on-chain activity.</p>
          </div>
        )}

        {isConnected && !isSignedIn && (
          <div className="flex flex-col items-center justify-center rounded-[28px] border border-[#E5E7EB] bg-white py-16 text-center shadow-sm">
            <ReceiptText className="h-10 w-10 text-[#3B82F6] mb-3" />
            <p className="font-semibold text-[#1C1C1E]">Sign in to view activity</p>
            <p className="text-sm text-[#6B7280] mt-1">Sign in with your wallet to load your transaction history.</p>
          </div>
        )}

        {isSignedIn && (
          <>
            <div className="mb-5 flex items-center gap-3 rounded-[20px] border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(17,24,39,0.04)]">
              <Search className="h-5 w-5 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search by address or tx hash"
                className="w-full border-none bg-transparent text-[var(--md-sys-color-on-surface)] outline-none placeholder:text-[#6B7280]"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
              {filters.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${filter === f ? 'bg-[#3B82F6] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-white shadow-[0_8px_24px_rgba(17,24,39,0.06)]">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-[#3B82F6]" />
                </div>
              ) : filteredTx.length > 0 ? (
                filteredTx.map((tx, idx) => (
                  <div key={tx.id} className={`flex items-center justify-between px-4 py-4 ${idx < filteredTx.length - 1 ? 'border-b border-[#F3F4F6]' : ''}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${TYPE_COLORS[tx.tx_type] ?? 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                        {TYPE_LABELS[tx.tx_type] ?? tx.tx_type}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1C1C1E] truncate">
                          {tx.tx_type === 'send' || tx.tx_type === 'checkin'
                            ? `To: ${shortAddr(tx.to_address)}`
                            : tx.tx_type === 'receive'
                            ? `From: ${shortAddr(tx.from_address)}`
                            : shortAddr(tx.tx_hash)}
                        </p>
                        <p className="text-xs text-[#9CA3AF]">
                          {new Date(tx.block_timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-[#1C1C1E]">
                        {tx.amount ? formatAmount(tx.amount, tx.token_symbol) : '—'}
                      </span>
                      <a
                        href={`https://explorer.arc.io/tx/${tx.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#9CA3AF] hover:text-[#3B82F6]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-16 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EFF6FF] text-[#3B82F6] mx-auto">
                    <ReceiptText className="h-7 w-7" />
                  </div>
                  <p className="font-semibold text-[#1C1C1E]">No transactions yet</p>
                  <p className="text-sm text-[#6B7280] mt-1">Your on-chain activity will appear here.</p>
                </div>
              )}
            </div>

            {walletAddress && (
              <div className="mt-4 text-center">
                <a
                  href={`https://explorer.arc.io/address/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3B82F6]"
                >
                  <ExternalLink className="h-4 w-4" />
                  View full history on Arc Explorer
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
}
