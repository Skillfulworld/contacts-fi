"use client";

/**
 * BridgePanel — CCTP V2 USDC bridge using Circle App Kit
 * Uses @circle-fin/app-kit + @circle-fin/adapter-viem-v2
 * No KIT_KEY required for bridge operations.
 * Supported chains sourced from Circle/Arc official documentation (2026-09-22).
 */

import { useState, useEffect } from 'react';
import {
  ArrowDown, ChevronDown, CheckCircle2, ExternalLink,
  Copy, AlertCircle, Loader2, RefreshCw,
} from 'lucide-react';
import { AppKit } from '@circle-fin/app-kit';
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2';
import type { EIP1193Provider } from 'viem';
import { useWallet } from '@/context/WalletContext';

// ─── Verified chain config ─────────────────────────────────────────────────
// Chain strings from Circle App Kit BridgeChain enum (v1.15.2)
// Chain IDs from Circle/Arc official docs
// Explorer URLs from Circle/Arc official docs
// Chain strings match BridgeChain enum values exactly (verified from @circle-fin/app-kit v1.15.2)
const BRIDGE_CHAINS = [
  { label: 'Arc Mainnet',   chain: 'Arc',       chainId: 5042,    explorer: 'https://explorer.arc.io' },
  { label: 'Ethereum',      chain: 'Ethereum',  chainId: 1,       explorer: 'https://etherscan.io' },
  { label: 'Base',          chain: 'Base',      chainId: 8453,    explorer: 'https://basescan.org' },
  { label: 'Arbitrum',      chain: 'Arbitrum',  chainId: 42161,   explorer: 'https://arbiscan.io' },
  { label: 'Optimism',      chain: 'Optimism',  chainId: 10,      explorer: 'https://optimistic.etherscan.io' },
  { label: 'Polygon',       chain: 'Polygon',   chainId: 137,     explorer: 'https://polygonscan.com' },
  { label: 'Avalanche',     chain: 'Avalanche', chainId: 43114,   explorer: 'https://snowtrace.io' },
] as const;

type ChainKey = typeof BRIDGE_CHAINS[number]['chain'];

// ─── Step types ────────────────────────────────────────────────────────────
type BridgeStep = 'approve' | 'burn' | 'fetchAttestation' | 'mint';
type StepState  = 'pending' | 'active' | 'success' | 'error';

interface StepStatus {
  name: BridgeStep;
  state: StepState;
  txHash?: string;
  explorerUrl?: string;
}

type UiStep = 'idle' | 'bridging' | 'success' | 'error';

// ─── AppKit singleton ──────────────────────────────────────────────────────
let _kit: AppKit | null = null;
function getKit() {
  if (!_kit) _kit = new AppKit();
  return _kit;
}

// ─── Chain dropdown ────────────────────────────────────────────────────────
function ChainDropdown({
  value, onChange, exclude, disabled, label,
}: {
  value: ChainKey;
  onChange: (c: ChainKey) => void;
  exclude?: ChainKey;
  disabled?: boolean;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const options  = BRIDGE_CHAINS.filter(c => c.chain !== exclude);
  const selected = BRIDGE_CHAINS.find(c => c.chain === value)!;

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-[#6B7280]">{label}</span>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(o => !o)}
          className="flex w-full items-center justify-between rounded-2xl bg-[#F2F3F5] px-4 py-4 text-base font-semibold text-[#1C1C1E] transition-colors hover:bg-[#E8E9EC] disabled:opacity-50"
        >
          <span>{selected.label}</span>
          <ChevronDown className={`h-4 w-4 text-[#6B7280] transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
            {options.map(c => (
              <button
                key={c.chain}
                type="button"
                onClick={() => { onChange(c.chain as ChainKey); setOpen(false); }}
                className={`flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-semibold transition-colors hover:bg-[#F5F6F8] ${value === c.chain ? 'text-[#6D5DF6]' : 'text-[#1C1C1E]'}`}
              >
                <span className="h-5 w-5 rounded-full bg-[#EDEBFF] text-[10px] font-bold text-[#6D5DF6] flex items-center justify-center leading-none">
                  {c.label.slice(0, 1)}
                </span>
                {c.label}
                {value === c.chain && <CheckCircle2 className="ml-auto h-4 w-4 text-[#6D5DF6]" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step progress indicator ───────────────────────────────────────────────
const STEP_LABELS: Record<BridgeStep, string> = {
  approve:          'Approve USDC',
  burn:             'Burn on source',
  fetchAttestation: 'Awaiting attestation',
  mint:             'Mint on destination',
};

function StepRow({ step, destExplorer, srcExplorer }: { step: StepStatus; destExplorer: string; srcExplorer: string }) {
  const explorer = step.name === 'mint' ? destExplorer : srcExplorer;
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#E5E7EB] bg-white">
        {step.state === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
        {step.state === 'active'  && <Loader2 className="h-4 w-4 animate-spin text-[#6D5DF6]" />}
        {step.state === 'error'   && <AlertCircle className="h-4 w-4 text-red-500" />}
        {step.state === 'pending' && <div className="h-2 w-2 rounded-full bg-[#D1D5DB]" />}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-semibold ${step.state === 'pending' ? 'text-[#9CA3AF]' : 'text-[#111827]'}`}>
          {STEP_LABELS[step.name]}
        </p>
        {step.txHash && (
          <a
            href={`${explorer}/tx/${step.txHash}`}
            target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-xs text-[#6D5DF6] hover:underline"
          >
            {step.txHash.slice(0, 10)}…{step.txHash.slice(-6)}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {step.name === 'fetchAttestation' && step.state === 'active' && (
          <p className="text-xs text-[#9CA3AF]">Circle CCTP ~8-20 seconds</p>
        )}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function BridgePanel() {
  const { walletProvider, walletAddress, isConnected, switchToArcMainnet, chainId } = useWallet();

  const [srcChain,  setSrcChain]  = useState<ChainKey>('Arc');
  const [dstChain,  setDstChain]  = useState<ChainKey>('Base');
  const [amount,    setAmount]    = useState('');
  const [uiStep,    setUiStep]    = useState<UiStep>('idle');
  const [steps,     setSteps]     = useState<StepStatus[]>([]);
  const [errMsg,    setErrMsg]    = useState<string | null>(null);
  const [copied,    setCopied]    = useState(false);

  // Track whether wallet is on the selected source chain
  const srcConfig  = BRIDGE_CHAINS.find(c => c.chain === srcChain)!;
  const dstConfig  = BRIDGE_CHAINS.find(c => c.chain === dstChain)!;
  const hexSrcId   = '0x' + srcConfig.chainId.toString(16);
  const isOnSrc    = chainId && (
    chainId === String(srcConfig.chainId) ||
    chainId.toLowerCase() === hexSrcId.toLowerCase()
  );
  const busy = uiStep === 'bridging';

  // Reset steps when chains change
  useEffect(() => {
    setSteps([]);
    setErrMsg(null);
    if (uiStep !== 'success') setUiStep('idle');
  }, [srcChain, dstChain]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFlip = () => {
    setSrcChain(dstChain);
    setDstChain(srcChain);
  };

  const handleReset = () => {
    setUiStep('idle');
    setSteps([]);
    setErrMsg(null);
    setAmount('');
  };

  // Switch wallet to source chain using EIP-3326/EIP-3085
  const switchToSrcChain = async (): Promise<boolean> => {
    if (!walletProvider?.request) return false;
    try {
      await walletProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexSrcId }],
      });
      return true;
    } catch (switchErr: unknown) {
      // Chain not added to wallet — add it
      if ((switchErr as { code?: number })?.code === 4902) {
        try {
          await walletProvider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: hexSrcId,
              chainName: srcConfig.label,
              nativeCurrency: srcChain === 'Arc'
                ? { name: 'USDC', symbol: 'USDC', decimals: 18 }
                : { name: 'ETH',  symbol: 'ETH',  decimals: 18 },
              rpcUrls: srcChain === 'Arc'
                ? ['https://rpc.mainnet.arc.io'] // arc-studio-allow-onchain-literal
                : [],
              blockExplorerUrls: [srcConfig.explorer],
            }],
          });
          return true;
        } catch { return false; }
      }
      return false;
    }
  };

  const handleBridge = async () => {
    if (!walletProvider?.request || !walletAddress || !amount || parseFloat(amount) <= 0) return;

    const parsedAmt = parseFloat(amount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setErrMsg('Enter a valid amount greater than 0.');
      return;
    }
    if (srcChain === dstChain) {
      setErrMsg('Source and destination chains must be different.');
      return;
    }

    setUiStep('bridging');
    setErrMsg(null);

    // Init steps
    const initialSteps: StepStatus[] = [
      { name: 'approve',          state: 'pending' },
      { name: 'burn',             state: 'pending' },
      { name: 'fetchAttestation', state: 'pending' },
      { name: 'mint',             state: 'pending' },
    ];
    setSteps(initialSteps);

    const updateStep = (name: BridgeStep, patch: Partial<StepStatus>) => {
      setSteps(prev => prev.map(s => s.name === name ? { ...s, ...patch } : s));
    };

    try {
      // Switch wallet to source chain first
      if (!isOnSrc) {
        const switched = await switchToSrcChain();
        if (!switched) {
          setErrMsg(`Please switch your wallet to ${srcConfig.label} and try again.`);
          setUiStep('error');
          return;
        }
      }

      // Create viem adapter from EIP-1193 provider
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adapter = await createViemAdapterFromProvider({ provider: walletProvider as any as EIP1193Provider });
      const kit     = getKit();

      // Mark approve as active
      updateStep('approve', { state: 'active' });

      const result = await kit.bridge({
        from: { adapter, chain: srcChain },
        to:   { adapter, chain: dstChain },
        amount: amount,
        // Forwarding service not used — user signs the mint tx themselves
      });

      // Parse step results from SDK response
      if (result.steps) {
        for (const s of result.steps) {
          const name = s.name as BridgeStep;
          updateStep(name, {
            state:       s.state === 'success' ? 'success' : s.state === 'error' ? 'error' : 'pending',
            txHash:      (s as { txHash?: string }).txHash,
            explorerUrl: (s as { explorerUrl?: string }).explorerUrl,
          });
        }
      }

      if (result.state === 'success') {
        // Mark all remaining pending steps as success (forwarding may skip some)
        setSteps(prev => prev.map(s => s.state === 'pending' || s.state === 'active' ? { ...s, state: 'success' } : s));
        setUiStep('success');
      } else {
        throw new Error(`Bridge ended in state: ${result.state}`);
      }

    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? 'Bridge failed.';
      const friendly =
        msg.includes('User rejected') || msg.includes('user rejected')
          ? 'Transaction rejected in wallet.'
          : msg.includes('insufficient')
          ? 'Insufficient USDC balance or gas.'
          : msg.includes('route') || msg.includes('chain')
          ? `Route not supported: ${srcConfig.label} → ${dstConfig.label}. Try a different chain pair.`
          : msg;
      setErrMsg(friendly);
      // Mark the active step as errored
      setSteps(prev => prev.map(s => s.state === 'active' ? { ...s, state: 'error' } : s));
      setUiStep('error');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  const srcTxHash = steps.find(s => s.name === 'burn')?.txHash;
  const dstTxHash = steps.find(s => s.name === 'mint')?.txHash;

  // Success screen
  if (uiStep === 'success') {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-7 w-7 text-green-500" />
          </div>
          <p className="text-lg font-semibold text-[#111827]">Bridge complete</p>
          <p className="text-sm text-[#6B7280]">
            {amount} USDC · {srcConfig.label} → {dstConfig.label}
          </p>

          {/* Step summary */}
          <div className="rounded-2xl bg-[#F9FAFB] p-4 space-y-3 text-left">
            {steps.map(s => (
              <StepRow key={s.name} step={s} srcExplorer={srcConfig.explorer} destExplorer={dstConfig.explorer} />
            ))}
          </div>

          {/* Tx links */}
          <div className="flex gap-3">
            {srcTxHash && (
              <a
                href={`${srcConfig.explorer}/tx/${srcTxHash}`}
                target="_blank" rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#EDEBFF] px-3 py-3 text-xs font-semibold text-[#6D5DF6]"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Source tx
              </a>
            )}
            {dstTxHash && (
              <a
                href={`${dstConfig.explorer}/tx/${dstTxHash}`}
                target="_blank" rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#EDEBFF] px-3 py-3 text-xs font-semibold text-[#6D5DF6]"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Dest tx
              </a>
            )}
            {srcTxHash && (
              <button
                onClick={async () => { await navigator.clipboard.writeText(srcTxHash); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[#E5E7EB] px-3 py-3 text-xs font-semibold text-[#1C1C1E]"
              >
                <Copy className="h-3.5 w-3.5" /> {copied ? 'Copied' : 'Copy hash'}
              </button>
            )}
          </div>
          <button onClick={handleReset} className="w-full rounded-2xl bg-[#6D5DF6] py-3.5 text-sm font-semibold text-white">
            New Bridge
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main card */}
      <div className="rounded-3xl bg-white p-6 shadow-sm space-y-4">

        {/* Chain selectors */}
        <ChainDropdown label="From" value={srcChain} onChange={v => { setSrcChain(v); }} exclude={dstChain} disabled={busy} />

        {/* Amount input */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#6B7280]">You Send</span>
            <span className="text-xs text-[#9CA3AF]">USDC</span>
          </div>
          <input
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            disabled={busy}
            onChange={e => {
              const v = e.target.value.replace(/[^0-9.]/g, '');
              if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v);
            }}
            className="w-full bg-transparent text-5xl font-bold tabular-nums text-[#111827] outline-none placeholder:text-[#D1D5DB] disabled:opacity-50"
            style={{ letterSpacing: '-0.02em' }}
          />
        </div>

        {/* Flip button */}
        <div className="flex justify-center">
          <button
            onClick={handleFlip}
            disabled={busy}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F1F5] text-[#6D5DF6] transition-colors hover:bg-[#EDEBFF] disabled:opacity-40"
          >
            <ArrowDown className="h-5 w-5" />
          </button>
        </div>

        <ChainDropdown label="To" value={dstChain} onChange={v => setDstChain(v)} exclude={srcChain} disabled={busy} />

        {/* Amount received estimate */}
        <div className="space-y-1">
          <span className="text-sm font-medium text-[#6B7280]">You Receive (est.)</span>
          <div className="text-5xl font-bold tabular-nums text-[#111827]" style={{ letterSpacing: '-0.02em' }}>
            {amount && parseFloat(amount) > 0 ? parseFloat(amount).toFixed(2) : '0.00'}
          </div>
          <p className="text-xs text-[#9CA3AF]">USDC · 1:1 minus CCTP fees (~8-20s fast mode)</p>
        </div>

        {/* Route info */}
        {amount && parseFloat(amount) > 0 && (
          <div className="rounded-2xl bg-[#F9FAFB] px-4 py-3 space-y-1.5 text-xs text-[#6B7280]">
            <div className="flex justify-between">
              <span>Protocol</span>
              <span className="font-semibold text-[#111827]">Circle CCTP V2</span>
            </div>
            <div className="flex justify-between">
              <span>Transfer speed</span>
              <span className="font-semibold text-[#111827]">Fast (~8-20 seconds)</span>
            </div>
            <div className="flex justify-between">
              <span>Route</span>
              <span className="font-semibold text-[#111827]">{srcConfig.label} → {dstConfig.label}</span>
            </div>
          </div>
        )}

        {/* In-progress step tracker */}
        {steps.length > 0 && uiStep === 'bridging' && (
          <div className="rounded-2xl bg-[#F9FAFB] p-4 space-y-3">
            {steps.map(s => (
              <StepRow key={s.name} step={s} srcExplorer={srcConfig.explorer} destExplorer={dstConfig.explorer} />
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {uiStep === 'error' && errMsg && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            <p>{errMsg}</p>
            <button onClick={handleReset} className="mt-1 font-semibold underline">Try again</button>
          </div>
        </div>
      )}

      {/* Network warning */}
      {isConnected && !isOnSrc && uiStep !== 'bridging' && (
        <button
          onClick={switchToSrcChain}
          className="flex w-full items-center justify-between rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800 hover:bg-amber-100 transition-colors"
        >
          <span>Wallet is on wrong network — tap to switch to {srcConfig.label}</span>
          <span className="ml-3 shrink-0 rounded-xl bg-[#6D5DF6] px-3 py-1.5 text-xs font-semibold text-white">Switch Network</span>
        </button>
      )}

      {/* CTA */}
      <div className="space-y-3">
        {!isConnected ? (
            <button
              onClick={() => switchToArcMainnet()}
              className="w-full rounded-3xl bg-[#6D5DF6] py-4 text-base font-semibold text-white shadow-sm"
            >
              Connect Wallet
            </button>
          ) : uiStep === 'bridging' ? (
            <button disabled className="flex w-full items-center justify-center gap-2 rounded-3xl bg-[#6D5DF6] py-4 text-base font-semibold text-white shadow-sm opacity-70">
              <Loader2 className="h-4 w-4 animate-spin" /> Bridging…
            </button>
          ) : (
            <button
              onClick={handleBridge}
              disabled={!amount || parseFloat(amount) <= 0 || srcChain === dstChain}
              className="flex w-full items-center justify-center gap-2 rounded-3xl bg-[#6D5DF6] py-4 text-base font-semibold text-white shadow-sm disabled:opacity-40"
            >
              <RefreshCw className="h-4 w-4" />
              Bridge {amount || '0'} USDC · {srcConfig.label} → {dstConfig.label}
            </button>
          )}
        </div>

      {/* Footer */}
      <p className="text-center text-xs text-[#9CA3AF]">
        Powered by Circle CCTP V2. Real funds — transactions are irreversible.
      </p>
    </div>
  );
}
