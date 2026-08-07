"use client";

import { ArrowDown, Check } from 'lucide-react';
import { Card } from '@/components/ui';

export default function SwapPage() {
  return (
    <div className="min-h-screen bg-[var(--md-sys-color-background)] p-4 pb-24">
      <div className="mx-auto flex max-w-lg flex-col gap-6 py-4">
        <div className="text-center">
            <h1 className="text-3xl font-semibold text-[var(--md-sys-color-on-background)]">Swap Tokens</h1>
            <p className="mt-2 text-sm text-[#6B7280]">Convert assets before sending.</p>
        </div>

        {/* Swap Card */}
        <Card className="p-6">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#6B7280]">You Pay</label>
            <div className="text-4xl font-bold text-[#1C1C1E] py-2">0.00</div>
            <div className="flex justify-between items-center bg-[#F5F6F8] rounded-2xl p-2 cursor-pointer border">
                <span className="font-semibold px-2">USDC</span>
                <span className="px-2">▼</span>
            </div>
          </div>
          
          <div className="my-4 flex justify-center">
            <div className="rounded-full bg-[#F5F6F8] p-3 border border-[#E5E7EB]">
              <ArrowDown className="h-6 w-6 text-[#6D5DF6]" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#6B7280]">You Receive</label>
            <div className="text-4xl font-bold text-[#1C1C1E] py-2">0.00</div>
            <div className="flex justify-between items-center bg-[#F5F6F8] rounded-2xl p-2 cursor-pointer border">
                <span className="font-semibold px-2">USDT</span>
                <span className="px-2">▼</span>
            </div>
          </div>
        </Card>

        {/* Info Cards */}
        <Card className="bg-gradient-to-br from-[#EDEBFF] to-[#EAF4FF] border-none p-6">
            <div className="text-lg font-semibold text-[#2F2A6B]">Powered by Arc</div>
            <p className="text-sm text-[#2F2A6B] mt-2 leading-relaxed">
                Cross-token payments are coming soon. Soon you'll be able to automatically swap supported assets before sending USDC to any contact.
            </p>
        </Card>

        <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Why ContactFi Swap?</h3>
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <Check className="text-green-500 h-5 w-5"/>
                    <span className="text-sm font-medium">No manual bridge</span>
                </div>
                <div className="flex items-center gap-3">
                    <Check className="text-green-500 h-5 w-5"/>
                    <span className="text-sm font-medium">No DEX hunting</span>
                </div>
                <div className="flex items-center gap-3">
                    <Check className="text-green-500 h-5 w-5"/>
                    <span className="text-sm font-medium">One payment flow</span>
                </div>
            </div>
        </Card>

        <button disabled className="w-full rounded-2xl bg-[#E5E7EB] text-[#6B7280] py-4 font-semibold text-lg">
            Swap Coming Soon
        </button>
      </div>
    </div>
  );
}
