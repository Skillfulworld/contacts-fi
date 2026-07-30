"use client";
import { useRouter } from 'next/navigation';
import { Button, Input, Card } from '@/components/ui';

export default function AddWalletPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 py-6">
        <button onClick={() => router.back()} className="text-2xl">✖️</button>
        <h1 className="text-2xl font-normal">Add Wallet</h1>
      </div>

      <Card className="mb-8 bg-[var(--md-sys-color-primary-container)]/20">
        <p className="text-sm text-[var(--md-sys-color-on-primary-container)]">
          You are adding a new wallet for contact ID: <span className="font-bold">{params.id}</span>
        </p>
      </Card>

      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] ml-1">Wallet Provider</label>
          <select className="md-input appearance-none">
            <option>Bitget Wallet</option>
            <option>MetaMask</option>
            <option>Phantom</option>
            <option>Coinbase Wallet</option>
            <option>Other</option>
          </select>
        </div>

        <Input label="Wallet Name" placeholder="e.g. Main Savings" />
        <Input label="Wallet Address" placeholder="0x..." />

        <div className="flex items-center justify-between p-4 bg-[var(--md-sys-color-surface-variant)]/50 rounded-2xl mt-4">
          <span className="text-sm font-medium">Set as Default Wallet</span>
          <div className="w-12 h-6 bg-[var(--md-sys-color-primary)] rounded-full relative">
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
          </div>
        </div>

        <div className="pt-8">
          <Button className="w-full" onClick={() => router.back()}>
            Save Wallet
          </Button>
        </div>
      </div>
    </div>
  );
}
