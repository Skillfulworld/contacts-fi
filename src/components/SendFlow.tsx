"use client";
import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui';
import { useWallet, getAppKitInstance, isArcTestnetChainId } from '@/context/WalletContext';
import { BridgeChain } from '@circle-fin/app-kit';
import { Send, CheckCircle2, ExternalLink, Copy, AlertCircle } from 'lucide-react';

export const SendFlow = ({ recipient, onClose, onTransactionComplete }: { recipient: { name: string; address?: string; wallets?: any[] }; onClose: () => void; onTransactionComplete: (tx: any) => void }) => {
  const { adapter, walletAddress, walletName, chainId, isConnected, refreshChain, switchToArcTestnet } = useWallet();
  const [sendStep, setSendStep] = useState<'network' | 'review' | 'sending' | 'success' | 'error'>('network');
  const [amount, setAmount] = useState('10');
  const [manualAddress, setManualAddress] = useState(recipient.address || '');
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [estimatedGas, setEstimatedGas] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const wallets = recipient.wallets || [{ id: 'manual', address: manualAddress, name: 'Manual Address' }];
  const selectedWallet = wallets.find((w: any) => w.id === selectedWalletId) || wallets[0];

  useEffect(() => {
    const init = async () => {
      setSelectedWalletId(wallets[0]?.id || '');
      if (!isConnected || !adapter || !walletAddress) {
        setSendStep('error');
        setSendError('Connect your wallet before sending funds.');
        return;
      }
      const currentChain = chainId || (await refreshChain());
      if (!isArcTestnetChainId(currentChain)) {
        setSendStep('network');
        return;
      }
      await prepareReview();
    };
    init();
  }, []);

  const prepareReview = async () => {
    if (!adapter || !walletAddress) {
      setSendStep('error');
      setSendError('Connect your wallet before sending USDC.');
      return;
    }
    setIsWorking(true);
    setSendError(null);
    try {
      const kit = getAppKitInstance();
      const sendParams = {
        from: { adapter: adapter as any, chain: BridgeChain.Arc_Testnet },
        to: selectedWallet?.address || manualAddress || walletAddress,
        amount,
        token: 'USDC',
      };
      const estimate = await kit.estimateSend(sendParams as any);
      setEstimatedGas(estimate?.fee ? `${estimate.fee} wei` : 'Unavailable');
      setSendStep('review');
    } catch (error: any) {
      setSendStep('error');
      setSendError(`Preparation failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsWorking(false);
    }
  };

  const handleSwitchNetwork = async () => {
    setIsWorking(true);
    setSendError(null);
    try {
      const result = await switchToArcTestnet();
      if (result.ok) {
        await prepareReview();
      } else {
        setSendStep('error');
        setSendError(result.error || 'Arc Testnet could not be activated.');
      }
    } catch (error) {
      setSendStep('error');
      setSendError('The network switch failed. Please try again.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleConfirmSend = async () => {
    if (!adapter || !walletAddress) {
      setSendStep('error');
      setSendError('Connect your wallet before sending funds.');
      return;
    }
    setIsWorking(true);
    setSendError(null);
    setSendStep('sending');
    try {
      const kit = getAppKitInstance();
      const sendParams = {
        from: { adapter: adapter as any, chain: BridgeChain.Arc_Testnet },
        to: selectedWallet?.address || manualAddress || walletAddress,
        amount,
        token: 'USDC',
      };
      const result = await kit.send(sendParams as any);
      const nextTxHash = (result as any)?.txHash || (result as any)?.transactionHash || null;
      const nextExplorerUrl = (result as any)?.explorerUrl || (result as any)?.explorer?.url || null;
      onTransactionComplete({
        id: nextTxHash || `tx-${Date.now()}`,
        amount: `${amount} USDC`,
        status: 'Success',
      });
      setTxHash(nextTxHash);
      setExplorerUrl(nextExplorerUrl);
      setSendStep('success');
    } catch (error: any) {
      setSendStep('error');
      setSendError(`Send failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsWorking(false);
    }
  };

  const handleCopyHash = async () => {
    if (!txHash) return;
    try {
      await navigator.clipboard.writeText(txHash);
      setCopiedHash(true);
      window.setTimeout(() => setCopiedHash(false), 1500);
    } catch (error) {
      console.error('Failed to copy tx hash', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-[0_16px_40px_rgba(17,24,39,0.16)]">
        <div className="mb-4 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6B7280]">Send USDC</div>
            <h2 className="text-xl font-semibold text-[#1C1C1E]">
              {sendStep === 'success' ? 'Transaction Sent' : sendStep === 'review' ? 'Review Transaction' : sendStep === 'sending' ? 'Sending' : sendStep === 'error' ? 'Unable to Continue' : 'Switch to Arc Testnet'}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-full border border-[#E5E7EB] bg-[#F5F6F8] px-3 py-2 text-sm font-medium text-[#1C1C1E]">
            Close
          </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
          {sendStep === 'network' && (
            <div className="space-y-4">
              <div className="rounded-[24px] border border-[#E5E7EB] bg-[#F5F6F8] p-4 text-sm leading-6 text-[#1C1C1E]">
                Arc Testnet is required before sending USDC from this wallet.
              </div>
              <Button className="w-full" onClick={handleSwitchNetwork} disabled={isWorking}>
                {isWorking ? 'Switching…' : 'Switch to Arc Testnet'}
              </Button>
            </div>
          )}

          {sendStep === 'review' && (
            <div className="space-y-4">
              <div className="rounded-[24px] border border-[#E5E7EB] bg-[#F5F6F8] p-4">
                <div className="text-sm font-semibold text-[#6B7280]">Recipient</div>
                <div className="mt-1 font-semibold text-[#1C1C1E]">{recipient.name}</div>
                <div className="text-sm text-[#6B7280]">{selectedWallet?.address || manualAddress || 'No wallet address available'}</div>
              </div>

              {recipient.wallets && (
                <div className="rounded-[24px] border border-[#E5E7EB] bg-[#F5F6F8] p-4">
                  <div className="mb-2 text-sm font-semibold text-[#6B7280]">Selected wallet</div>
                  <select
                    value={selectedWalletId}
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                    className="w-full rounded-2xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#1C1C1E] outline-none"
                  >
                    {recipient.wallets.map((wallet: any) => (
                      <option key={wallet.id} value={wallet.id}>{wallet.name || wallet.provider}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="rounded-[24px] border border-[#E5E7EB] bg-[#F5F6F8] p-4">
                <div className="mb-2 flex items-center justify-between text-sm font-semibold text-[#6B7280]">
                  <span>Amount</span>
                  <span>Token</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-2xl border border-[#E5E7EB] bg-white px-3 py-2 text-lg font-semibold text-[#1C1C1E] outline-none"
                  />
                  <div className="rounded-2xl bg-[#EDEBFF] px-3 py-2 text-sm font-semibold text-[#6D5DF6]">USDC</div>
                </div>
              </div>

              <div className="rounded-[24px] border border-[#E5E7EB] bg-[#F5F6F8] p-4 text-sm text-[#1C1C1E]">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[#6B7280]">Estimated gas</span>
                  <span className="font-semibold">{estimatedGas || 'Preparing…'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Source wallet</span>
                  <span className="font-semibold">{walletName || 'Connected Wallet'}</span>
                </div>
              </div>
            </div>
          )}

          {sendStep === 'sending' && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EDEBFF] text-[#6D5DF6]">
                <Send className="h-6 w-6" />
              </div>
              <div className="text-lg font-semibold text-[#1C1C1E]">Broadcasting your transaction</div>
              <div className="text-sm leading-6 text-[#6B7280]">Please keep this window open while Circle AppKit completes the transfer.</div>
            </div>
          )}

          {sendStep === 'success' && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF4FF] text-[#4DA3FF]">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="text-lg font-semibold text-[#1C1C1E]">Transaction sent successfully</div>
              <div className="rounded-[24px] border border-[#E5E7EB] bg-[#F5F6F8] p-4 text-sm text-[#6B7280] break-all">
                {txHash || 'No transaction hash returned.'}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                {explorerUrl ? (
                  <a href={explorerUrl} target="_blank" rel="noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#EDEBFF] px-4 py-3 text-sm font-semibold text-[#6D5DF6]">
                    <ExternalLink className="h-4 w-4" />
                    View on ArcScan
                  </a>
                ) : null}
                <button onClick={handleCopyHash} className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#1C1C1E]">
                  <Copy className="h-4 w-4" />
                  {copiedHash ? 'Copied' : 'Copy Transaction Hash'}
                </button>
              </div>
              <Button className="w-full" onClick={onClose}>
                Done
              </Button>
            </div>
          )}

          {sendStep === 'error' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-[24px] border border-[#F9D7D7] bg-[#FDECEC] p-4 text-sm leading-6 text-[#6B1F1F]">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{sendError || 'The transaction could not be completed.'}</span>
              </div>
              <Button className="w-full" onClick={() => setSendStep('network')}>Try Again</Button>
            </div>
          )}
        </div>

        {sendStep === 'review' && (
          <div className="mt-4 flex gap-3 flex-shrink-0">
            <Button variant="tonal" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleConfirmSend} disabled={isWorking}>
              {isWorking ? 'Sending…' : 'Confirm Send'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
