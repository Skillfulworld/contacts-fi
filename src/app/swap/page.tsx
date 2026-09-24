"use client";

import { useState, useEffect, useRef } from 'react';
import BridgePanel from '@/components/BridgePanel';
import PageLayout from '@/components/PageLayout';
import { ArrowDown, ChevronDown, CheckCircle2, ExternalLink, Copy, AlertCircle, Loader2 } from 'lucide-react';
import {
  createWalletClient,
  createPublicClient,
  custom,
  http,
  erc20Abi,
  parseUnits,
  formatUnits,
  type Hex,
} from 'viem';
import { arc } from 'viem/chains';
import { useWallet } from '@/context/WalletContext';

// ─── Arc Mainnet constants ────────────────────────────────────────────────────
const ARC_RPC      = 'https://rpc.mainnet.arc.io';           // arc-studio-allow-onchain-literal
const ROUTER       = '0x53BF6B0684Ec7eF91e1387Da3D1a1769bC5A6F77' as Hex; // arc-studio-allow-onchain-literal — Uniswap V3 SwapRouter02

// SwapRouter02 exactInputSingle ABI
const ROUTER_ABI = [
  {
    name: 'exactInputSingle',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{
      name: 'params', type: 'tuple',
      components: [
        { name: 'tokenIn',           type: 'address' },
        { name: 'tokenOut',          type: 'address' },
        { name: 'fee',               type: 'uint24'  },
        { name: 'recipient',         type: 'address' },
        { name: 'amountIn',          type: 'uint256' },
        { name: 'amountOutMinimum',  type: 'uint256' },
        { name: 'sqrtPriceLimitX96', type: 'uint160' },
      ],
    }],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
] as const;

// ─── Token list ───────────────────────────────────────────────────────────────
const TOKEN_LIST = [
  { symbol: 'USDC',   address: '0x3600000000000000000000000000000000000000' as Hex, decimals: 6 },  // arc-studio-allow-onchain-literal
  { symbol: 'EURC',   address: '0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1' as Hex, decimals: 6 },  // arc-studio-allow-onchain-literal
  { symbol: 'cirBTC', address: '0x171a4217b86a807a64eb94757db6849fb4bdbaa0' as Hex, decimals: 8 },  // arc-studio-allow-onchain-literal
] as const;

type TokenSymbol = typeof TOKEN_LIST[number]['symbol'];

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 'idle' | 'quoting' | 'quoted' | 'approving' | 'swapping' | 'success' | 'error';

type Quote = {
  fromToken: string; toToken: string;
  tokenInAddress: Hex; tokenOutAddress: Hex;
  inDecimals: number; outDecimals: number;
  amountIn: string; amountOut: string; minAmountOut: string;
  fee: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(raw: string | bigint, decimals: number, dp = 6): string {
  const n = typeof raw === 'bigint' ? raw : BigInt(raw);
  return parseFloat(formatUnits(n, decimals)).toLocaleString(undefined, {
    minimumFractionDigits: 2, maximumFractionDigits: dp,
  });
}

// ─── Token Dropdown ───────────────────────────────────────────────────────────
function TokenDropdown({
  value, onChange, exclude, disabled,
}: {
  value: TokenSymbol; onChange: (t: TokenSymbol) => void; exclude?: TokenSymbol; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const options = TOKEN_LIST.filter(t => t.symbol !== exclude);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between rounded-2xl bg-[#F2F3F5] px-4 py-4 text-base font-semibold text-[#1C1C1E] transition-colors hover:bg-[#E8E9EC] disabled:opacity-50"
      >
        <span>{value}</span>
        <ChevronDown className={`h-4 w-4 text-[#6B7280] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
          {options.map(t => (
            <button
              key={t.symbol}
              type="button"
              onClick={() => { onChange(t.symbol as TokenSymbol); setOpen(false); }}
              className={`flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-semibold transition-colors hover:bg-[#F5F6F8] ${value === t.symbol ? 'text-[#6D5DF6]' : 'text-[#1C1C1E]'}`}
            >
              <span className="h-5 w-5 rounded-full bg-[#EDEBFF] text-[10px] font-bold text-[#6D5DF6] flex items-center justify-center leading-none">
                {t.symbol.slice(0, 1)}
              </span>
              {t.symbol}
              {value === t.symbol && <CheckCircle2 className="ml-auto h-4 w-4 text-[#6D5DF6]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SwapPage() {
  const { walletProvider, walletAddress, isConnected, connectWallet, switchToArcMainnet, chainId } = useWallet();

  const [mode, setMode] = useState<'swap' | 'bridge'>('swap');

  const [tokenIn,  setTokenIn]  = useState<TokenSymbol>('USDC');
  const [tokenOut, setTokenOut] = useState<TokenSymbol>('EURC');
  const [amountIn, setAmountIn] = useState('');
  const [step,     setStep]     = useState<Step>('idle');
  const [quote,    setQuote]    = useState<Quote | null>(null);
  const [txHash,   setTxHash]   = useState<string | null>(null);
  const [errMsg,   setErrMsg]   = useState<string | null>(null);
  const [copied,   setCopied]   = useState(false);
  const [balanceIn, setBalanceIn] = useState<string | null>(null);


  const tokenInMeta  = TOKEN_LIST.find(t => t.symbol === tokenIn)!;
  const tokenOutMeta = TOKEN_LIST.find(t => t.symbol === tokenOut)!;
  const isOnArc = chainId && (chainId.toLowerCase() === '0x13b2' || chainId === '5042');
  const busy = step === 'quoting' || step === 'approving' || step === 'swapping';

  // Fetch balance of tokenIn on Arc Mainnet
  useEffect(() => {
    if (!walletAddress || !isConnected) { setBalanceIn(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const pc = createPublicClient({ chain: arc, transport: http(ARC_RPC) }); // arc-studio-allow-onchain-literal
        const raw = await pc.readContract({
          address: tokenInMeta.address,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [walletAddress as Hex],
        });
        if (!cancelled) setBalanceIn(fmt(raw, tokenInMeta.decimals));
      } catch { if (!cancelled) setBalanceIn('0.00'); }
    })();
    return () => { cancelled = true; };
  }, [walletAddress, isConnected, tokenIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFlip = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setQuote(null);
    if (step === 'quoted') setStep('idle');
  };

  const handleReset = () => {
    setStep('idle'); setQuote(null); setTxHash(null);
    setErrMsg(null); setAmountIn('');
  };

  // ── Get Quote ───────────────────────────────────────────────────────────────
  const handleGetQuote = async () => {
    if (!walletAddress || !amountIn || parseFloat(amountIn) <= 0) return;
    setStep('quoting'); setErrMsg(null); setQuote(null);
    try {
      const res  = await fetch('/api/swap/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromToken: tokenIn, toToken: tokenOut, amount: amountIn, userAddress: walletAddress }),
      });
      const data = await res.json();
      if (!res.ok) { setErrMsg(data.error ?? `Quote failed (${res.status}).`); setStep('error'); return; }
      setQuote(data as Quote);
      setStep('quoted');
    } catch { setErrMsg('Network error. Please try again.'); setStep('error'); }
  };

  // ── Execute Swap ────────────────────────────────────────────────────────────
  const handleSwap = async () => {
    if (!quote || !walletProvider?.request || !walletAddress) return;
    setErrMsg(null);

    try {
      // 1. Ensure wallet is on Arc Mainnet
      if (!isOnArc) {
        setStep('swapping');
        const result = await switchToArcMainnet();
        if (!result.ok) { setErrMsg(result.error ?? 'Could not switch to Arc Mainnet.'); setStep('error'); return; }
      }

      // 2. Get unsigned tx envelope from server
      setStep('swapping');
      const execRes = await fetch('/api/swap/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: tokenIn, toToken: tokenOut,
          amount: amountIn,
          minAmountOut: quote.minAmountOut,
          fee: quote.fee,
          userAddress: walletAddress,
          outDecimals: quote.outDecimals,
        }),
      });
      const env = await execRes.json();
      if (!execRes.ok) { setErrMsg(env.error ?? `Execute failed (${execRes.status}).`); setStep('error'); return; }

      const account = walletAddress as Hex;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const walletClient = createWalletClient({ chain: arc, transport: custom(walletProvider as any), account });
      const publicClient = createPublicClient({ chain: arc, transport: http(ARC_RPC) }); // arc-studio-allow-onchain-literal

      // 3. Check allowance → approve if needed
      const amountInBig = BigInt(quote.amountIn);
      const allowance = await publicClient.readContract({
        address: quote.tokenInAddress,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [account, ROUTER],
      });

      if (allowance < amountInBig) {
        setStep('approving');
        const approveHash = await walletClient.writeContract({
          address: quote.tokenInAddress,
          abi: erc20Abi,
          functionName: 'approve',
          args: [ROUTER, amountInBig],
          account,
          maxFeePerGas: parseUnits('20', 9), // Arc minimum 20 gwei
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        setStep('swapping');
      }

      // 4. Execute swap on Arc via SwapRouter02.exactInputSingle
      const swapHash = await walletClient.writeContract({
        address: ROUTER,
        abi: ROUTER_ABI,
        functionName: 'exactInputSingle',
        args: [{
          tokenIn:           quote.tokenInAddress,
          tokenOut:          quote.tokenOutAddress,
          fee:               quote.fee,
          recipient:         account,
          amountIn:          amountInBig,
          amountOutMinimum:  BigInt(quote.minAmountOut),
          sqrtPriceLimitX96: BigInt(0),
        }],
        account,
        maxFeePerGas: parseUnits('20', 9), // Arc minimum 20 gwei
      });

      await publicClient.waitForTransactionReceipt({ hash: swapHash });
      setTxHash(swapHash);
      setStep('success');
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? 'Swap failed.';
      setErrMsg(
        msg.includes('User rejected') || msg.includes('user rejected')
          ? 'Transaction rejected in wallet.'
          : msg,
      );
      setStep('error');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <PageLayout brandSide="left" swapMode={mode}>
    <div className="bg-[#F0F1F5] px-4 py-3 lg:py-4 pb-28 lg:pb-4" suppressHydrationWarning>
      <div className="mx-auto flex max-w-md flex-col gap-4 lg:gap-4">

        {/* Swap / Bridge toggle — at the very top so visible without scrolling on mobile */}
        <div className="flex rounded-2xl bg-white p-1 shadow-sm">
          <button
            onClick={() => setMode('swap')}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              mode === 'swap'
                ? 'bg-[#6D5DF6] text-white shadow-sm'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            Swap
          </button>
          <button
            onClick={() => setMode('bridge')}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              mode === 'bridge'
                ? 'bg-[#6D5DF6] text-white shadow-sm'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            Bridge
          </button>
        </div>

        {/* Bridge panel — mounts when mode === 'bridge', DEX below is unchanged */}
        {mode === 'bridge' && <BridgePanel />}

        {/* ── DEX section — only rendered in swap mode, completely unchanged ── */}
        {mode === 'swap' && <>

        {/* Success screen */}
        {step === 'success' && (
          <div className="rounded-3xl bg-white p-6 shadow-sm text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-7 w-7 text-green-500" />
            </div>
            <p className="text-lg font-semibold text-[#111827]">Swap complete</p>
            {txHash && (
              <div className="rounded-2xl bg-[#F5F6F8] px-4 py-3 text-xs font-mono text-[#6B7280] break-all">
                {txHash}
              </div>
            )}
            <div className="flex gap-3">
              {txHash && (
                <>
                  <a
                    href={`https://explorer.arc.io/tx/${txHash}`}
                    target="_blank" rel="noreferrer"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#EDEBFF] px-4 py-3 text-sm font-semibold text-[#6D5DF6]"
                  >
                    <ExternalLink className="h-4 w-4" /> View on Explorer
                  </a>
                  <button
                    onClick={async () => { await navigator.clipboard.writeText(txHash); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm font-semibold text-[#1C1C1E]"
                  >
                    <Copy className="h-4 w-4" /> {copied ? 'Copied' : 'Copy hash'}
                  </button>
                </>
              )}
            </div>
            <button onClick={handleReset} className="w-full rounded-2xl bg-[#6D5DF6] py-3.5 text-sm font-semibold text-white">
              New Swap
            </button>
          </div>
        )}

        {/* Main swap card */}
        {step !== 'success' && (
          <div className="rounded-3xl bg-white p-4 lg:p-5 shadow-sm space-y-1">

            {/* You Pay */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#6B7280]">You Pay</span>
                {isConnected && balanceIn !== null && (
                  <button
                    className="text-xs text-[#6D5DF6] font-semibold"
                    onClick={() => setAmountIn(balanceIn.replace(/,/g, ''))}
                  >
                    Balance: {balanceIn} · Max
                  </button>
                )}
              </div>
              <input
                inputMode="decimal"
                placeholder="0.00"
                value={amountIn}
                disabled={busy}
                onChange={e => {
                  const v = e.target.value.replace(/[^0-9.]/g, '');
                  if (v === '' || /^\d*\.?\d*$/.test(v)) {
                    setAmountIn(v);
                    setQuote(null);
                    if (step === 'quoted') setStep('idle');
                  }
                }}
                className="w-full bg-transparent text-4xl lg:text-3xl font-bold tabular-nums text-[#111827] outline-none placeholder:text-[#D1D5DB] disabled:opacity-50"
                style={{ letterSpacing: '-0.02em' }}
              />
              <TokenDropdown value={tokenIn} onChange={v => { setTokenIn(v); setQuote(null); setStep('idle'); }} exclude={tokenOut} disabled={busy} />
            </div>

            {/* Flip arrow */}
            <div className="flex justify-center py-2">
              <button
                onClick={handleFlip}
                disabled={busy}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F1F5] text-[#6D5DF6] transition-colors hover:bg-[#EDEBFF] disabled:opacity-40"
              >
                <ArrowDown className="h-5 w-5" />
              </button>
            </div>

            {/* You Receive */}
            <div className="space-y-2">
              <span className="text-sm font-medium text-[#6B7280]">You Receive</span>
              <div className="text-4xl lg:text-3xl font-bold tabular-nums text-[#111827]" style={{ letterSpacing: '-0.02em' }}>
                {quote ? fmt(quote.amountOut, quote.outDecimals) : '0.00'}
              </div>
              <TokenDropdown value={tokenOut} onChange={v => { setTokenOut(v); setQuote(null); setStep('idle'); }} exclude={tokenIn} disabled={busy} />
            </div>

            {/* Quote details */}
            {quote && (
              <div className="mt-4 rounded-2xl bg-[#F9FAFB] px-4 py-3 space-y-1.5 text-xs text-[#6B7280]">
                <div className="flex justify-between">
                  <span>Estimated output</span>
                  <span className="font-semibold text-[#111827]">{fmt(quote.amountOut, quote.outDecimals)} {tokenOut}</span>
                </div>
                <div className="flex justify-between">
                  <span>Minimum received (0.5% slippage)</span>
                  <span className="font-semibold text-[#111827]">{fmt(quote.minAmountOut, quote.outDecimals)} {tokenOut}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fee tier</span>
                  <span className="font-semibold text-[#111827]">{(quote.fee / 10000).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Route</span>
                  <span className="font-semibold text-[#111827]">Uniswap V3 · Arc Mainnet</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {step === 'error' && errMsg && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <p>{errMsg}</p>
              <button onClick={handleReset} className="mt-1 font-semibold underline">Try again</button>
            </div>
          </div>
        )}

        {/* Network warning */}
        {isConnected && !isOnArc && step !== 'success' && (
          <div className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span>Switch to Arc Mainnet to swap</span>
            <button onClick={() => switchToArcMainnet()} className="ml-3 shrink-0 font-semibold underline">Switch</button>
          </div>
        )}

        {/* CTA */}
        {step !== 'success' && (
          <div className="space-y-3">
            {!isConnected ? (
              <button
                onClick={() => connectWallet()}
                className="w-full rounded-3xl bg-[#6D5DF6] py-4 text-base font-semibold text-white shadow-sm"
              >
                Connect Wallet
              </button>
            ) : !quote ? (
              <button
                onClick={handleGetQuote}
                disabled={!amountIn || parseFloat(amountIn) <= 0 || tokenIn === tokenOut || step === 'quoting'}
                className="flex w-full items-center justify-center gap-2 rounded-3xl bg-[#6D5DF6] py-4 text-base font-semibold text-white shadow-sm disabled:opacity-40"
              >
                {step === 'quoting' ? <><Loader2 className="h-4 w-4 animate-spin" /> Getting quote…</> : 'Get Quote'}
              </button>
            ) : (
              <>
                <button
                  onClick={handleSwap}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-3xl bg-[#6D5DF6] py-4 text-base font-semibold text-white shadow-sm disabled:opacity-40"
                >
                  {step === 'approving' ? <><Loader2 className="h-4 w-4 animate-spin" /> Approving…</>
                   : step === 'swapping' ? <><Loader2 className="h-4 w-4 animate-spin" /> Swapping…</>
                   : `Swap ${amountIn} ${tokenIn} → ${tokenOut}`}
                </button>
                {!busy && (
                  <button onClick={() => { setQuote(null); setStep('idle'); }} className="w-full text-center text-sm text-[#6B7280] underline">
                    Edit / get new quote
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Info */}
        {step !== 'success' && (
          <p className="text-center text-xs text-[#9CA3AF]">
            Swaps execute on Arc Mainnet via Uniswap V3. Real funds — transactions are irreversible.
          </p>
        )}

        </>} {/* end mode === 'swap' */}

      </div>
    </div>
    </PageLayout>
  );
}
