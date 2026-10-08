"use client";
import { useState } from 'react';
import { useContacts } from '@/context/ContactContext';
import { Avatar, SearchBar, Button, Input } from '@/components/ui';
import PageLayout from '@/components/PageLayout';
import { SendFlow } from '@/components/SendFlow';
import { User, ClipboardPaste } from 'lucide-react';

export default function SendPage() {
  const { contacts, addTransaction } = useContacts();
  const [searchTerm, setSearchTerm] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [recipient, setRecipient] = useState<{ name: string; address?: string; wallets?: any[] } | null>(null);

  const filteredContacts = contacts.filter((c: any) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startSend = (recipientData: { name: string; address?: string; wallets?: any[] }) => {
    setRecipient(recipientData);
  };

  return (
    <PageLayout brandSide="right">
    <div className="p-4 relative overflow-hidden">
      {/* Title with decorative shapes alongside */}
      <div className="relative inline-block mb-6">
        <div className="pointer-events-none absolute -top-3 -right-12 w-16 h-16 rounded-full border-[3px] border-[#FFB347] opacity-25" />
        <div className="pointer-events-none absolute top-1 -right-6 w-4 h-4 rotate-45 bg-[#4DA3FF] opacity-30" />
        <div className="pointer-events-none absolute -top-1 -right-20 w-8 h-8 rounded-full bg-[#34D399] opacity-12" />
        <h1 className="text-2xl font-semibold">Send USDC</h1>
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-[#6B7280] mb-3">Paste Address</h2>
        <div className="flex gap-2">
            <Input value={manualAddress} onChange={(e: any) => setManualAddress(e.target.value)} placeholder="0x..." />
            <Button onClick={() => startSend({ name: 'Manual', address: manualAddress })}>
                <ClipboardPaste className="h-4 w-4" />
            </Button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-[#6B7280] mb-3">Select Contact</h2>
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
        <div className="mt-4 space-y-2">
            {filteredContacts.map((c: any) => (
                <button key={c.id} onClick={() => startSend({ name: c.name, wallets: c.wallets })} className="w-full flex items-center gap-4 rounded-[24px] border border-[#E5E7EB] bg-white p-4 shadow-sm transition-all hover:bg-[#F9FAFB]">
                    <Avatar initials={c.initials} color={c.color} />
                    <div className="text-left">
                        <div className="font-semibold text-[#1C1C1E]">{c.name}</div>
                        <div className="text-sm text-[#6B7280]">{c.defaultProvider}</div>
                    </div>
                </button>
            ))}
        </div>
      </div>

      {recipient && (
        <SendFlow
          recipient={recipient}
          onClose={() => setRecipient(null)}
          onTransactionComplete={(tx) => {
            addTransaction({
              ...tx,
              type: 'sent',
              contact: recipient.name,
              date: 'Just now',
            });
            setRecipient(null);
          }}
        />
      )}
    </div>
    </PageLayout>
  );
}
