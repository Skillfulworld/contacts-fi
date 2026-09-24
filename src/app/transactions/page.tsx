"use client";
import { useState } from 'react';
import { useContacts } from '@/context/ContactContext';
import { TransactionCard } from '@/components/ui';
import PageLayout from '@/components/PageLayout';
import { Search, ReceiptText, FileDown } from 'lucide-react';

export default function TransactionsHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const { transactions } = useContacts();

  const filteredTx = transactions.filter((t: any) => {
    const matchesSearch = t.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.wallet.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesFilter = true;
    if (filter === 'Sent') matchesFilter = t.type === 'sent';
    else if (filter === 'Received') matchesFilter = t.type === 'received';
    else if (filter === 'Failed') matchesFilter = t.status === 'Failed';

    return matchesSearch && matchesFilter;
  });

  const filters = ['All', 'Sent', 'Received', 'Failed'];

  return (
    <PageLayout brandSide="right">
    <div className="bg-[var(--md-sys-color-background)] p-4 pb-24">
      <div className="flex items-center justify-between py-6">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--md-sys-color-on-background)]">Activity</h1>
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
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${filter === f ? 'bg-[#6D5DF6] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-white shadow-[0_8px_24px_rgba(17,24,39,0.06)]">
        {filteredTx.length > 0 ? (
          [...filteredTx]
            .reverse()
            .map((tx: any) => <TransactionCard key={tx.id} tx={tx} />)
        ) : (
          <div className="p-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EDEBFF] text-[#6D5DF6] mx-auto">
              <ReceiptText className="h-7 w-7" />
            </div>
            <p className="text-sm text-[#6B7280]">No matching transactions found.</p>
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
    </PageLayout>
  );
}
