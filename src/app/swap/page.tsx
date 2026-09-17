"use client";

import { useState, useCallback } from 'react';
import { ArrowDown, ArrowLeftRight, AlertCircle, CheckCircle2, ExternalLink, Copy, Info } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { type SwapEstimate } from '@circle-fin/app-kit';
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2';
import { useWallet, isArcMainnetChainId, getAppKitInstance } from '@/context/WalletContext';

// Tokens supported on Arc Mainnet (USDC is native; EURC is the main swap partner)
const ARC_TOKENS = ['USDC', 'EURC'] as const;
type ArcToken = typeof ARC_TOKENS[number];

type SwapStep = 'idle' | 'estimating' | 'reviewed' | 'swapping' | 'success' | 'error';

type ReviewedSwap = {
  estimate: SwapEstimate;
  tokenIn: ArcToken;
  tokenOut: ArcToken;
  amountIn: string;
};

const kit = getAppKitInstance();

export default function SwapPage() {
  const { walletProvider, chainId, isConnected, switchToArcMainnet } = useWallet();

  const [tokenIn, setTokenIn] = useState<ArcToken>('EURC');
  const [tokenOut, setTokenOut] = useState<ArcToken>('USDC');
  const [amountIn, setAmountIn] = useState('');

  const [step, setStep] = useState<SwapStep>('idle');
  const [reviewed, setReviewed] = useState<ReviewedSwap | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isOnMainnet = isArcMainnetChainId(chainId);
  const isValid = amountIn.trim() !== '' && parseFloat(amountIn) > 0;

  // Guard: USDC <-> USDC is a no-op on Arc
  const isSameAsset = tokenIn === tokenOut;

  const getAdapter = useCallback(async () => {
    if (!walletProvider?.request) throw new Error('Wallet not connected.');
    if (!isOnMainnet) {
      const result = await switchToArcMainnet();
      if (!result.ok) throw new Error(result.error || 'Failed to switch to Arc Mainnet.');
    }
    return await createViemAdapterFromProvider({ provider: walletProvider as Parameters<typeof createViemAdapterFromProvider>[0]['provider'] });
  }, [walletProvider, isOnMainnet, switchToArcMainnet]);

  const handleFlip = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setReviewed(null);
    setStep('idle');
  };

  const handleGetQuote = async () => {
    if (!isValid || isSameAsset) return;
    setStep('estimating');
    setErrorMessage(null);
    try {
      const adapter = await getAdapter();
      const estimate = await kit.estimateSwap({
        from: { adapter, chain: 'Arc' },
        tokenIn,
        tokenOut,
        amountIn,
        config: { slippageBps: 300 },
      });
      setReviewed({ estimate, tokenIn, tokenOut, amountIn });
      setStep('reviewed');
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || 'Could not fetch a quote. Try again.');
      setStep('error');
    }
  };

  const handleSwap = async () => {
    if (!reviewed) return;
    if (reviewed.tokenIn !== tokenIn || reviewed.tokenOut !== tokenOut || reviewed.amountIn !== amountIn) {
      setErrorMessage('Quote is stale. Please get a new quote first.');
      setStep('error');
      return;
    }
    setStep('swapping');
    setErrorMessage(null);
    try {
      const adapter = await getAdapter();
      const result = await kit.swap({
        from: { adapter, chain: 'Arc' },
        tokenIn: reviewed.tokenIn,
        tokenOut: reviewed.tokenOut,
        amountIn: reviewed.amountIn,
        config: { slippageBps: 300 },
      });
      setTxHash((result as { txHash?: string })?.txHash || null);
      setExplorerUrl((result as { explorerUrl?: string })?.explorerUrl || null);
      setStep('success');
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || 'Swap failed. Please try again.');
      setStep('error');
    }
  };

  const handleCopyHash = async () => {
    if (!txHash) return;
    await navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleReset = () => {
    setStep('idle');
    setReviewed(null);
    setTxHash(null);
    setExplorerUrl(null);
    setErrorMessage(null);
    setAmountIn('');
  };

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-background)] p-4 pb-24">
      <div className="mx-auto flex max-w-lg flex-col gap-6 py-4">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-[var(--md-sys-color-on-background)]">Swap Tokens</h1>
          <p className="mt-2 text-sm text-[#6B7280]">Convert assets on Arc Mainnet.</p>
        </div>

        {/* Mainnet warning banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>You are on <strong>Arc Mainnet</strong>. Swaps involve real funds and are irreversible. Start with small amounts.</span>
        </div>

        {/* Aggregator disclosure */}
        <div className="flex items-start gap-3 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-xs text-[#6B7280]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Swaps are routed through third-party DEX aggregators (currently LiFi). Routes and aggregators may vary. By swapping you agree to the aggregator&apos;s terms of service.</span>
        </div>

        {/* Swap Card */}
        {step !== 'success' && (
          <Card className="p-6">
            {/* Pay */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#6B7280]">You Pay</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amountIn}
                onChange={(e) => { setAmountIn(e.target.value); setReviewed(null); setStep('idle'); }}
                disabled={step === 'swapping'}
                className="w-full rounded-2xl border border-[#E5E7EB] bg-[#F5F6F8] px-4 py-3 text-2xl font-bold text-[#1C1C1E] outline-none transition-all focus:border-[#6D5DF6] disabled:opacity-50"
              />
              <div className="flex items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-[#F5F6F8] p-2">
                {ARC_TOKENS.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTokenIn(t); setReviewed(null); setStep('idle'); }}
                    disabled={step === 'swapping'}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${tokenIn === t ? 'bg-[#6D5DF6] text-white shadow' : 'text-[#6B7280] hover:bg-[#EDEBFF] hover:text-[#6D5DF6]'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Flip button */}
            <div className="my-4 flex justify-center">
              <button
                onClick={handleFlip}
                disabled={step === 'swapping'}
                className="rounded-full border border-[#E5E7EB] bg-[#F5F6F8] p-3 transition-all hover:bg-[#EDEBFF] hover:text-[#6D5DF6] disabled:opacity-40"
              >
                <ArrowDown className="h-5 w-5" />
              </button>
            </div>

            {/* Receive */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#6B7280]">You Receive</label>
              <div className="w-full rounded-2xl border border-[#E5E7EB] bg-[#F5F6F8] px-4 py-3 text-2xl font-bold text-[#1C1C1E]">
                {step === 'reviewed' && reviewed
                  ? reviewed.estimate.estimatedOutput?.amount ?? '—'
                  : '—'}
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-[#F5F6F8] p-2">
                {ARC_TOKENS.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTokenOut(t); setReviewed(null); setStep('idle'); }}
                    disabled={step === 'swapping'}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${tokenOut === t ? 'bg-[#6D5DF6] text-white shadow' : 'text-[#6B7280] hover:bg-[#EDEBFF] hover:text-[#6D5DF6]'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {isSameAsset && (
              <p className="mt-3 text-xs text-[#D64545]">Select two different tokens to swap.</p>
            )}

            {/* Quote details */}
            {step === 'reviewed' && reviewed && (
              <div className="mt-4 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-sm space-y-1 text-[#6B7280]">
                <div className="flex justify-between">
                  <span>Estimated output</span>
                  <span className="font-semibold text-[#1C1C1E]">
                    {reviewed.estimate.estimatedOutput?.amount} {reviewed.estimate.estimatedOutput?.token}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Slippage tolerance</span>
                  <span className="font-semibold text-[#1C1C1E]">3%</span>
                </div>
                {reviewed.estimate.fees?.map((fee, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{fee.type} fee</span>
                    <span className="font-semibold text-[#1C1C1E]">{fee.amount} {fee.token}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Success card */}
        {step === 'success' && (
          <Card className="p-6 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF4FF] text-[#4DA3FF]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="text-xl font-semibold text-[#1C1C1E]">Swap complete</div>
            {txHash && (
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#F5F6F8] p-3 text-xs text-[#6B7280] break-all">{txHash}</div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              {explorerUrl && (
                <a href={explorerUrl} target="_blank" rel="noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#EDEBFF] px-4 py-3 text-sm font-semibold text-[#6D5DF6]">
                  <ExternalLink className="h-4 w-4" />
                  View on Explorer
                </a>
              )}
              {txHash && (
                <button onClick={handleCopyHash} className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#1C1C1E]">
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied' : 'Copy Hash'}
                </button>
              )}
            </div>
            <Button className="w-full" onClick={handleReset}>New Swap</Button>
          </Card>
        )}

        {/* Error */}
        {step === 'error' && errorMessage && (
          <div className="flex items-start gap-3 rounded-2xl border border-[#F9D7D7] bg-[#FDECEC] p-4 text-sm text-[#6B1F1F]">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p>{errorMessage}</p>
              <button onClick={handleReset} className="mt-2 font-semibold underline">Try again</button>
            </div>
          </div>
        )}

        {/* Not connected */}
        {!isConnected && (
          <p className="text-center text-sm text-[#6B7280]">Connect your wallet to swap.</p>
        )}

        {/* Actions */}
        {step !== 'success' && isConnected && (
          <div className="flex flex-col gap-3">
            {step !== 'reviewed' && (
              <Button
                className="w-full"
                onClick={handleGetQuote}
                disabled={!isValid || isSameAsset || step === 'estimating' || step === 'swapping'}
              >
                {step === 'estimating' ? 'Getting quote…' : 'Get Quote'}
              </Button>
            )}
            {step === 'reviewed' && reviewed && (
              <Button
                className="w-full"
                onClick={handleSwap}
                disabled={step === 'swapping'}
              >
                {step === 'swapping' ? 'Swapping…' : `Swap ${reviewed.amountIn} ${reviewed.tokenIn} → ${reviewed.tokenOut}`}
              </Button>
            )}
            {step === 'reviewed' && (
              <button onClick={handleReset} className="text-sm text-[#6B7280] underline text-center">
                Edit swap
              </button>
            )}
          </div>
        )}

        {/* Info footer */}
        <Card className="bg-gradient-to-br from-[#EDEBFF] to-[#EAF4FF] border-none p-5">
          <div className="flex items-center gap-2 text-base font-semibold text-[#2F2A6B]">
            <ArrowLeftRight className="h-4 w-4" />
            Arc Mainnet Swaps
          </div>
          <p className="mt-2 text-sm text-[#2F2A6B] leading-relaxed">
            Swap USDC and EURC natively on Arc. USDC is the native gas token — one balance, used for both fees and transfers.
          </p>
        </Card>

      </div>
    </div>
  );
}
