"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useContacts } from '@/context/ContactContext';
import { Button, Input } from '@/components/ui';

const PROVIDERS = ['MetaMask', 'Coinbase Wallet', 'Phantom', 'Bitget Wallet', 'Other'];

export default function AddWalletPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { addWallet } = useContacts();

  const [provider, setProvider] = useState('MetaMask');
  const [walletName, setWalletName] = useState('');
  const [address, setAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setAddressError('');
    if (!address.trim()) {
      setAddressError('Wallet address is required');
      return;
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(address.trim())) {
      setAddressError('Invalid Ethereum address (must be 0x followed by 40 hex characters)');
      return;
    }
    setIsSaving(true);
    addWallet(params.id, {
      address: address.trim().toLowerCase(),
      provider,
      name: walletName.trim() || provider,
      isDefault,
    });
    router.back();
  };

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-background)] p-4">
      <div className="flex items-center gap-4 py-6">
        <button
          onClick={() => router.back()}
          className="rounded-full border border-[#E5E7EB] bg-white p-2 text-[#1C1C1E] shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-semibold text-[var(--md-sys-color-on-background)]">Add Wallet</h1>
      </div>

      <div className="space-y-6 rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[0_8px_24px_rgba(17,24,39,0.06)]">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#6B7280] ml-1">Wallet Provider</label>
          <select
            value={provider}
            onChange={e => setProvider(e.target.value)}
            className="w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          >
            {PROVIDERS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        <Input
          label="Wallet Name"
          placeholder="e.g. Main Savings"
          value={walletName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWalletName(e.target.value)}
        />

        <div>
          <Input
            label="Wallet Address"
            placeholder="0x..."
            value={address}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setAddress(e.target.value);
              setAddressError('');
            }}
          />
          {addressError && <p className="mt-1 text-xs text-red-500">{addressError}</p>}
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
          <span className="text-sm font-medium text-[#1C1C1E]">Set as Default Wallet</span>
          <button
            type="button"
            onClick={() => setIsDefault(prev => !prev)}
            className={`relative h-6 w-12 rounded-full transition-colors ${isDefault ? 'bg-[#3B82F6]' : 'bg-[#E5E7EB]'}`}
          >
            <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${isDefault ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="pt-4">
          <Button className="w-full" onClick={handleSave} disabled={isSaving}>
            Save Wallet
          </Button>
        </div>
      </div>
    </div>
  );
}
