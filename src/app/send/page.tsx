"use client";
import { useState } from 'react';
import { useContacts } from '@/context/ContactContext';
import { Avatar, SearchBar, Button, Input } from '@/components/ui';
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
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-6">Send USDC</h1>

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
  );
}
