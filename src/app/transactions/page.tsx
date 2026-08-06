"use client";
import { useState } from 'react';
import { ALL_TRANSACTIONS } from '@/lib/mockData';
import { TransactionCard } from '@/components/ui';
import { Search, ReceiptText, FileDown } from 'lucide-react';

export default function TransactionsHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTx = ALL_TRANSACTIONS.filter((t) =>
    t.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.wallet.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-background)] p-4 pb-24">
      <div className="flex items-center justify-between py-6">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6B7280]">
            <ReceiptText className="h-3.5 w-3.5 text-[#6D5DF6]" />
            Activity
          </div>
          <h1 className="text-2xl font-semibold text-[var(--md-sys-color-on-background)]">Transactions</h1>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-[20px] border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(17,24,39,0.04)]">
        <Search className="h-5 w-5 text-[#6B7280]" />
        <input
          type="text"
          placeholder="Search by contact or wallet"
          className="w-full border-none bg-transparent text-[var(--md-sys-color-on-surface)] outline-none placeholder:text-[#6B7280]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        <button className="rounded-full bg-[#6D5DF6] px-4 py-2 text-xs font-semibold whitespace-nowrap text-white">All</button>
        <button className="rounded-full bg-[#F3F4F6] px-4 py-2 text-xs font-semibold whitespace-nowrap text-[#6B7280]">Sent</button>
        <button className="rounded-full bg-[#F3F4F6] px-4 py-2 text-xs font-semibold whitespace-nowrap text-[#6B7280]">Received</button>
        <button className="rounded-full bg-[#F3F4F6] px-4 py-2 text-xs font-semibold whitespace-nowrap text-[#6B7280]">Failed</button>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-white shadow-[0_8px_24px_rgba(17,24,39,0.06)]">
        {filteredTx.length > 0 ? (
          filteredTx.map((tx) => <TransactionCard key={tx.id} tx={tx} />)
        ) : (
          <div className="p-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EDEBFF] text-[#6D5DF6] mx-auto">
              <ReceiptText className="h-7 w-7" />
            </div>
            <p className="text-sm text-[#6B7280]">No transactions found.</p>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-[#6B7280]">Showing the latest 30 days of activity</p>
        <button className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-[#6D5DF6] mx-auto">
          <FileDown className="h-4 w-4" />
          Download report (CSV)
        </button>
      </div>
    </div>
  );
}
