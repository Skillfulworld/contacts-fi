"use client";

/**
 * Activity page — reads USDC Transfer events directly from Arc Mainnet RPC.
 * No auth, no Supabase. Works as soon as wallet is connected.
 * Check-in events from SettleXPoints contract are also shown.
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, ReceiptText, Loader2, RefreshCw, ExternalLink, ArrowUpRight, ArrowDownLeft, Zap } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { useWallet } from '@/context/WalletContext';

const ARC_RPC = 'https://rpc.mainnet.arc.io';
const ARC_EXPLORER = 'https://explorer.arc.io';
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const SETTLEX_POINTS = '0xaf75c1b6EDeE3Cf03FF1282145dD7878EcFfB7B0';

// ERC-20 Transfer topic: keccak256("Transfer(address,address,uint256)")
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
// SettleXPoints CheckedIn topic: keccak256("CheckedIn(address,uint256,uint256,uint256,uint256,uint256)")
const CHECKIN_TOPIC_KNOWN = '0x2e3a0e5adef96bba61bf1f2960bc6e5a3e1c06f1af1e10b4e98e5be7e8f5b3d9';

interface Tx {
  hash: string;
  type: 'send' | 'receive' | 'checkin';
  amount: string;
  counterpart: string;
  timestamp: number;
  blockNumber: string;
}

async function rpc(method: string, params: unknown[]) {
  const res = await fetch(ARC_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

function padAddr(addr: string) {
  return '0x' + addr.replace('0x', '').toLowerCase().padStart(64, '0');
}

function shortAddr(addr: string) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

async function fetchTransactions(wallet: string): Promise<Tx[]> {
  const walletLower = wallet.toLowerCase();

  // Get latest block
  const latestHex: string = await rpc('eth_blockNumber', []);
  const latest = parseInt(latestHex, 16);
  // Look back ~24h worth of blocks (~7200 blocks at ~12s each), chunked at 2000
  const lookback = 7200;
  const fromBlock = Math.max(0, latest - lookback);

  const chunks: Array<[number, number]> = [];
  for (let start = fromBlock; start <= latest; start += 2000) {
    chunks.push([start, Math.min(start + 1999, latest)]);
  }

  const allLogs: Array<{
    transactionHash: string;
    topics: string[];
    data: string;
    blockNumber: string;
    address: string;
  }> = [];

  for (const [from, to] of chunks) {
    try {
      // USDC sent by wallet
      const sentLogs = await rpc('eth_getLogs', [{
        fromBlock: '0x' + from.toString(16),
        toBlock:   '0x' + to.toString(16),
        address: USDC_ADDRESS,
        topics: [TRANSFER_TOPIC, padAddr(walletLower)],
      }]);
      // USDC received by wallet
      const recvLogs = await rpc('eth_getLogs', [{
        fromBlock: '0x' + from.toString(16),
        toBlock:   '0x' + to.toString(16),
        address: USDC_ADDRESS,
        topics: [TRANSFER_TOPIC, null, padAddr(walletLower)],
      }]);
      // Check-in events from SettleXPoints contract
      const checkinLogs = await rpc('eth_getLogs', [{
        fromBlock: '0x' + from.toString(16),
        toBlock:   '0x' + to.toString(16),
        address: SETTLEX_POINTS,
        topics: [CHECKIN_TOPIC_KNOWN, padAddr(walletLower)],
      }]);

      allLogs.push(...(sentLogs ?? []), ...(recvLogs ?? []), ...(checkinLogs ?? []));
    } catch {
      // Silently skip chunks that fail
    }
  }

  if (allLogs.length === 0) return [];

  // Fetch timestamps for unique block numbers
  const blockNums = [...new Set(allLogs.map(l => l.blockNumber))];
  const blockTimes = new Map<string, number>();
  await Promise.all(
    blockNums.map(async (bn) => {
      try {
        const block = await rpc('eth_getBlockByNumber', [bn, false]);
        if (block?.timestamp) blockTimes.set(bn, parseInt(block.timestamp, 16));
      } catch { /* ignore */ }
    })
  );

  const txMap = new Map<string, Tx>();

  for (const log of allLogs) {
    const hash = log.transactionHash;
    if (txMap.has(hash)) continue; // deduplicate

    const ts = blockTimes.get(log.blockNumber) ?? 0;

    // Check-in event from SettleXPoints
    if (log.address.toLowerCase() === SETTLEX_POINTS.toLowerCase()) {
      txMap.set(hash, {
        hash,
        type: 'checkin',
        amount: '',
        counterpart: SETTLEX_POINTS,
        timestamp: ts,
        blockNumber: log.blockNumber,
      });
      continue;
    }

    // USDC Transfer
    if (log.topics.length >= 3) {
      const from = '0x' + log.topics[1].slice(-40);
      const to   = '0x' + log.topics[2].slice(-40);
      const rawAmount = log.data && log.data !== '0x' ? BigInt(log.data) : 0n;
      const amount = (Number(rawAmount) / 1e6).toFixed(2);

      if (from.toLowerCase() === walletLower) {
        txMap.set(hash, { hash, type: 'send',    amount, counterpart: to,   timestamp: ts, blockNumber: log.blockNumber });
      } else {
        txMap.set(hash, { hash, type: 'receive', amount, counterpart: from, timestamp: ts, blockNumber: log.blockNumber });
      }
    }
  }

  return [...txMap.values()].sort((a, b) => b.timestamp - a.timestamp);
}

const TYPE_CONFIG = {
  send:    { label: 'Sent',      bg: 'bg-red-50',        text: 'text-red-600',     icon: ArrowUpRight   },
  receive: { label: 'Received',  bg: 'bg-green-50',      text: 'text-green-600',   icon: ArrowDownLeft  },
  checkin: { label: 'Check-in',  bg: 'bg-[#EFF6FF]',     text: 'text-[#3B82F6]',  icon: Zap            },
};

function TxRow({ tx }: { tx: Tx }) {
  const cfg = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.send;
  const Icon = cfg.icon;
  const date = tx.timestamp
    ? new Date(tx.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#F3F4F6] last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cfg.bg} ${cfg.text}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#1C1C1E]">{cfg.label}</p>
          <p className="truncate text-xs text-[#9CA3AF]">
            {tx.type === 'checkin' ? 'Daily check-in reward' : tx.type === 'send' ? `To ${shortAddr(tx.counterpart)}` : `From ${shortAddr(tx.counterpart)}`}
            {' · '}{date}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {tx.amount && (
          <span className={`text-sm font-bold ${tx.type === 'send' ? 'text-[#1C1C1E]' : 'text-green-600'}`}>
            {tx.type === 'send' ? '-' : '+'}{tx.amount} USDC
          </span>
        )}
        <a
          href={`${ARC_EXPLORER}/tx/${tx.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#D1D5DB] hover:text-[#3B82F6] transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

export default function TransactionsHistoryPage() {
  const { walletAddress, isConnected } = useWallet();

  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [loadError, setLoadError] = useState<string | null>(null);

  const filters = ['All', 'Sent', 'Received', 'Check-in'];

  const load = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const txs = await fetchTransactions(walletAddress);
      setTransactions(txs);
    } catch (err) {
      console.error('tx load error', err);
      setLoadError('Could not load transactions. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (isConnected && walletAddress) load();
    else setTransactions([]);
  }, [isConnected, walletAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  const filterMap: Record<string, Tx['type']> = { Sent: 'send', Received: 'receive', 'Check-in': 'checkin' };
  const filtered = transactions.filter(tx => {
    if (filter !== 'All' && tx.type !== filterMap[filter]) return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return tx.hash.toLowerCase().includes(q) || tx.counterpart.toLowerCase().includes(q);
  });

  return (
    <PageLayout brandSide="right">
      <div className="bg-[var(--md-sys-color-background)] p-4 pb-28">
        <div className="flex items-center justify-between py-6">
          <h1 className="text-3xl font-semibold text-[var(--md-sys-color-on-background)]">Activity</h1>
          {isConnected && (
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

        {!isConnected ? (
          <div className="flex flex-col items-center justify-center rounded-[28px] border border-[#E5E7EB] bg-white py-16 text-center shadow-sm">
            <ReceiptText className="h-10 w-10 text-[#E5E7EB] mb-3" />
            <p className="font-semibold text-[#1C1C1E]">Connect your wallet</p>
            <p className="text-sm text-[#6B7280] mt-1">Connect to see your on-chain activity.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3 rounded-[20px] border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(17,24,39,0.04)]">
              <Search className="h-5 w-5 text-[#6B7280] shrink-0" />
              <input
                type="text"
                placeholder="Search by address or tx hash"
                className="w-full border-none bg-transparent text-[var(--md-sys-color-on-surface)] outline-none placeholder:text-[#6B7280] text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {filters.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${filter === f ? 'bg-[#3B82F6] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}
                >
                  {f}
                </button>
              ))}
            </div>

            {loadError && (
              <div className="mb-4 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {loadError}
              </div>
            )}

            <div className="overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-white shadow-[0_8px_24px_rgba(17,24,39,0.06)]">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-[#3B82F6]" />
                </div>
              ) : filtered.length > 0 ? (
                filtered.map(tx => <TxRow key={tx.hash} tx={tx} />)
              ) : (
                <div className="p-16 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EFF6FF] text-[#3B82F6] mx-auto">
                    <ReceiptText className="h-7 w-7" />
                  </div>
                  <p className="font-semibold text-[#1C1C1E]">No transactions yet</p>
                  <p className="text-sm text-[#6B7280] mt-1">Your USDC sends, receives, and check-ins appear here.</p>
                </div>
              )}
            </div>

            {walletAddress && (
              <div className="mt-4 text-center">
                <a
                  href={`${ARC_EXPLORER}/address/${walletAddress}`}
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
