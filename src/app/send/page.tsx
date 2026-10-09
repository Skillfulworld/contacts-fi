"use client";

import { useState } from 'react';
import { useContacts } from '@/context/ContactContext';
import { Avatar, SearchBar } from '@/components/ui';
import PageLayout from '@/components/PageLayout';
import { SendFlow } from '@/components/SendFlow';
import WalletBalanceCard from '@/components/WalletBalanceCard';
import { ArrowRight, ClipboardPaste, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Recipient = { name: string; address?: string; wallets?: any[] };

/* ─── Desktop brand column ─────────────────────────────────────────── */
function SendBrandCol() {
  return (
    <div className="flex flex-col justify-between h-full px-10 py-12">
      {/* Copy block — top */}
      <div className="max-w-xs">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-3">
          Send USDC
        </p>
        <h2 className="text-4xl font-bold text-[#111827] leading-tight mb-4" style={{ letterSpacing: '-0.02em' }}>
          Send it simply.
        </h2>
        <p className="text-base text-[#6B7280] leading-relaxed text-pretty">
          Choose a contact, choose a wallet, and send USDC directly on Arc Mainnet.
        </p>
      </div>

      {/* Balance card — middle */}
      <div className="my-auto py-10">
        <WalletBalanceCard />
      </div>

      {/* Subtle footer note */}
      <p className="text-xs text-[#9CA3AF]">Powered by Arc Mainnet · USDC</p>
    </div>
  );
}

/* ─── Mobile quick-send bar ─────────────────────────────────────────── */
function MobileQuickSend({ onSend }: { onSend: (addr: string) => void }) {
  const [open, setOpen] = useState(false);
  const [addr, setAddr] = useState('');

  const handleSend = () => {
    const trimmed = addr.trim();
    if (!trimmed.startsWith('0x') || trimmed.length !== 42) return;
    onSend(trimmed);
    setAddr('');
    setOpen(false);
  };

  return (
    <div className="mb-5">
      {/* Heading row */}
      <div className="relative inline-flex items-center gap-3 mb-3">
        {/* Decorative shapes */}
        <div className="pointer-events-none absolute -top-3 -right-14 w-16 h-16 rounded-full border-[3px] border-[#FFB347] opacity-25" />
        <div className="pointer-events-none absolute top-1 -right-8 w-4 h-4 rotate-45 bg-[#4DA3FF] opacity-30" />
        <div className="pointer-events-none absolute -top-1 -right-22 w-8 h-8 rounded-full bg-[#34D399] opacity-20" />

        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 group"
        >
          <h1 className="text-2xl font-bold text-[#111827]" style={{ letterSpacing: '-0.02em' }}>
            Send USDC
          </h1>
          <div className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 ${open ? 'bg-[#6D5DF6] rotate-45' : 'bg-[#F3F4F6] group-hover:bg-[#E5E7EB]'}`}>
            {open
              ? <X className="h-3.5 w-3.5 text-white" />
              : <ArrowRight className="h-3.5 w-3.5 text-[#6B7280]" />
            }
          </div>
        </button>
      </div>

      {/* Expandable address input */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 pt-1 pb-3">
              <div className="relative flex-1">
                <input
                  value={addr}
                  onChange={e => setAddr(e.target.value)}
                  placeholder="Paste wallet address (0x...)"
                  className="w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#6D5DF6] focus:ring-2 focus:ring-[#6D5DF6]/10 transition"
                />
                <button
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      setAddr(text);
                    } catch { /* noop */ }
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                  title="Paste from clipboard"
                >
                  <ClipboardPaste className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleSend}
                disabled={!addr.trim().startsWith('0x') || addr.trim().length !== 42}
                className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl bg-[#6D5DF6] text-white shadow-sm transition hover:bg-[#5B4EE0] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────── */
export default function SendPage() {
  const { contacts, addTransaction } = useContacts();
  const [searchTerm, setSearchTerm] = useState('');
  const [recipient, setRecipient] = useState<Recipient | null>(null);

  const filteredContacts = contacts.filter((c: any) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startSend = (r: Recipient) => setRecipient(r);

  return (
    <PageLayout brandSide="right" brandContent={<SendBrandCol />}>
      {/* ── App column ── */}
      <div className="p-4 lg:p-6">

        {/* Mobile: expandable quick-send heading */}
        <div className="lg:hidden">
          <MobileQuickSend onSend={(addr) => startSend({ name: 'Manual', address: addr })} />
        </div>

        {/* Desktop: simple heading */}
        <div className="hidden lg:block mb-6">
          <h1 className="text-2xl font-bold text-[#111827]" style={{ letterSpacing: '-0.02em' }}>
            Send USDC
          </h1>
        </div>

        {/* Mobile: balance card above contacts */}
        <div className="lg:hidden mb-6">
          <WalletBalanceCard />
        </div>

        {/* Desktop: paste address bar */}
        <div className="hidden lg:block mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2">Paste address</p>
          <QuickAddressBar onSend={(addr) => startSend({ name: 'Manual', address: addr })} />
        </div>

        {/* Contacts list */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">Select contact</p>
          <SearchBar value={searchTerm} onChange={setSearchTerm} />
          <div className="mt-3 space-y-2 pb-28 lg:pb-6">
            {filteredContacts.length === 0 && (
              <p className="py-8 text-center text-sm text-[#9CA3AF]">No contacts yet. Add one from the Contacts page.</p>
            )}
            {filteredContacts.map((c: any) => (
              <button
                key={c.id}
                onClick={() => startSend({ name: c.name, wallets: c.wallets })}
                className="w-full flex items-center gap-4 rounded-[20px] border border-[#E5E7EB] bg-white p-4 shadow-sm transition-all hover:bg-[#F9FAFB] hover:border-[#D1D5DB] active:scale-[0.99]"
              >
                <Avatar initials={c.initials} color={c.color} />
                <div className="text-left flex-1 min-w-0">
                  <div className="font-semibold text-[#1C1C1E] truncate">{c.name}</div>
                  <div className="text-sm text-[#6B7280] truncate">{c.defaultProvider || 'Wallet'}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#D1D5DB] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Send modal */}
      {recipient && (
        <SendFlow
          recipient={recipient}
          onClose={() => setRecipient(null)}
          onTransactionComplete={(tx) => {
            addTransaction({ ...tx, type: 'sent', contact: recipient.name, date: 'Just now' });
            setRecipient(null);
          }}
        />
      )}
    </PageLayout>
  );
}

/* ─── Desktop address bar ─────────────────────────────────────────── */
function QuickAddressBar({ onSend }: { onSend: (addr: string) => void }) {
  const [addr, setAddr] = useState('');
  const valid = addr.trim().startsWith('0x') && addr.trim().length === 42;

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <input
          value={addr}
          onChange={e => setAddr(e.target.value)}
          placeholder="0x..."
          className="w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#6D5DF6] focus:ring-2 focus:ring-[#6D5DF6]/10 transition"
        />
        <button
          onClick={async () => {
            try { setAddr(await navigator.clipboard.readText()); } catch { /* noop */ }
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
          title="Paste"
        >
          <ClipboardPaste className="h-4 w-4" />
        </button>
      </div>
      <button
        onClick={() => { if (valid) onSend(addr.trim()); }}
        disabled={!valid}
        className="flex h-[46px] items-center gap-2 rounded-2xl bg-[#6D5DF6] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5B4EE0] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Send <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
