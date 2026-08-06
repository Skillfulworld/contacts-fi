"use client";

import Link from 'next/link';
import { ArrowLeft, Wallet, Network, Package, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '@/components/ui';
import { useWallet } from '@/context/WalletContext';

export default function ProfilePage() {
  const { walletAddress, walletName, chainId } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy address', error);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-background)] p-4 pb-24">
      <div className="py-4">
        <Link href="/settings" className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#1C1C1E] shadow-sm">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-[0_8px_24px_rgba(17,24,39,0.06)]">
          <div className="mb-6 flex items-center gap-4">
            <Avatar initials="ME" color="#6D5DF6" size="lg" />
            <div>
              <div className="text-lg font-semibold text-[#1C1C1E]">My Profile</div>
              <div className="text-sm text-[#6B7280]">Wallet details and app info</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-[#E5E7EB] bg-[#F5F6F8] p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#6B7280]">
                <Wallet className="h-4 w-4" />
                Connected Wallet
              </div>
              <div className="font-semibold text-[#1C1C1E]">{walletName || 'No wallet connected'}</div>
              <div className="mt-2 flex items-center gap-2 break-all text-sm text-[#6B7280]">
                <span>{walletAddress || 'Not available yet'}</span>
                {walletAddress && (
                  <button onClick={handleCopy} className="rounded-full border border-[#E5E7EB] bg-white p-1.5 text-[#6D5DF6]">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-[#E5E7EB] bg-[#F5F6F8] p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#6B7280]">
                <Network className="h-4 w-4" />
                Current Network
              </div>
              <div className="font-semibold text-[#1C1C1E]">{chainId ? `Chain ${chainId}` : 'Not available'}</div>
            </div>

            <div className="rounded-[24px] border border-[#E5E7EB] bg-[#F5F6F8] p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#6B7280]">
                <Package className="h-4 w-4" />
                App Version
              </div>
              <div className="font-semibold text-[#1C1C1E]">1.0.0-alpha</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
