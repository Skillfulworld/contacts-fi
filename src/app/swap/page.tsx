"use client";

import { useMemo, useState } from 'react';
import { ArrowLeftRight, Sparkles, Wallet2, ShieldCheck } from 'lucide-react';
import { Button, Card } from '@/components/ui';

const mockTokens = [
  { symbol: 'ETH', name: 'Ethereum', balance: '4.82', price: 1842.18, accent: 'bg-[#EAF4FF] text-[#4DA3FF]' },
  { symbol: 'USDC', name: 'USD Coin', balance: '1820.45', price: 1.0, accent: 'bg-[#EDEBFF] text-[#6D5DF6]' },
  { symbol: 'ARB', name: 'Arc Token', balance: '1280.12', price: 2.46, accent: 'bg-[#FFF0EA] text-[#FF7A59]' },
];

export default function SwapPage() {
  const [fromToken, setFromToken] = useState(mockTokens[0]);
  const [toToken, setToToken] = useState(mockTokens[1]);
  const [amount, setAmount] = useState('1.25');

  const estimatedOutput = useMemo(() => {
    const numericAmount = Number(amount) || 0;
    const rate = fromToken.price / toToken.price;
    return (numericAmount * rate).toFixed(2);
  }, [amount, fromToken.price, toToken.price]);

  const handleReverse = () => {
    const previousFrom = fromToken;
    setFromToken(toToken);
    setToToken(previousFrom);
  };

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-background)] p-4 pb-24">
      <div className="mx-auto flex max-w-2xl flex-col gap-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6B7280]">
              <Sparkles className="h-3.5 w-3.5 text-[#6D5DF6]" />
              Premium Swap
            </div>
            <h1 className="text-3xl font-semibold text-[var(--md-sys-color-on-background)]">Swap</h1>
          </div>
          <div className="rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#1C1C1E] shadow-sm">
            Arc Testnet
          </div>
        </div>

        <Card className="border-none bg-[#EDEBFF] p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[#2F2A6B]">Route ready</div>
              <div className="text-sm text-[#6B7280]">Mock quotes prepared for future DEX integration.</div>
            </div>
            <div className="rounded-2xl bg-white/70 p-3 text-[#6D5DF6]">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[#1C1C1E]">From</div>
              <div className="text-xs text-[#6B7280]">Choose a token to send</div>
            </div>
            <div className="rounded-full bg-[#F5F6F8] px-3 py-1 text-xs font-semibold text-[#6B7280]">
              Balance {fromToken.balance}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-[24px] border border-[#E5E7EB] bg-[#F5F6F8] p-4">
            <div className="flex items-center justify-between gap-3">
              <button className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-3 py-2 text-left shadow-sm">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${fromToken.accent}`}>
                  {fromToken.symbol[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1C1C1E]">{fromToken.symbol}</div>
                  <div className="text-xs text-[#6B7280]">{fromToken.name}</div>
                </div>
              </button>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-28 rounded-2xl border border-[#E5E7EB] bg-white px-3 py-2 text-right text-lg font-semibold text-[#1C1C1E] outline-none"
                placeholder="0"
              />
            </div>
            <div className="text-right text-xs text-[#6B7280]">~ ${Number(amount || 0).toFixed(2)}</div>
          </div>

          <div className="my-3 flex justify-center">
            <button
              onClick={handleReverse}
              className="rounded-full border border-[#E5E7EB] bg-white p-3 text-[#6D5DF6] shadow-sm transition-all duration-200 hover:-translate-y-0.5"
              aria-label="Reverse swap"
            >
              <ArrowLeftRight className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[#1C1C1E]">To</div>
              <div className="text-xs text-[#6B7280]">Estimated destination token</div>
            </div>
            <div className="rounded-full bg-[#F5F6F8] px-3 py-1 text-xs font-semibold text-[#6B7280]">
              Balance {toToken.balance}
            </div>
          </div>

          <div className="rounded-[24px] border border-[#E5E7EB] bg-[#F5F6F8] p-4">
            <div className="flex items-center justify-between gap-3">
              <button className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-3 py-2 text-left shadow-sm">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${toToken.accent}`}>
                  {toToken.symbol[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1C1C1E]">{toToken.symbol}</div>
                  <div className="text-xs text-[#6B7280]">{toToken.name}</div>
                </div>
              </button>
              <div className="text-right">
                <div className="text-lg font-semibold text-[#1C1C1E]">{estimatedOutput}</div>
                <div className="text-xs text-[#6B7280]">Estimated output</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between rounded-[20px] border border-[#E5E7EB] bg-[#F5F6F8] px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-[#6B7280]">
              <Wallet2 className="h-4 w-4" />
              Network
            </div>
            <div className="font-semibold text-[#1C1C1E]">Arc Testnet</div>
          </div>

          <div className="mt-4 rounded-[20px] border border-[#E5E7EB] bg-[#F5F6F8] p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-[#6B7280]">Estimated output</span>
              <span className="font-semibold text-[#1C1C1E]">{estimatedOutput} {toToken.symbol}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6B7280]">Route</span>
              <span className="font-semibold text-[#1C1C1E]">Mock quote • ready for DEX</span>
            </div>
          </div>

          <Button className="mt-4 w-full" variant="primary">
            Swap
          </Button>
        </Card>
      </div>
    </div>
  );
}
