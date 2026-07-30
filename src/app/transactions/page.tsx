"use client";
import { useState } from 'react';
import { ALL_TRANSACTIONS } from '@/lib/mockData';
import { TransactionCard, SectionHeader } from '@/components/ui';

export default function TransactionsHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTx = ALL_TRANSACTIONS.filter(t =>
    t.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.wallet.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4">
      <div className="flex items-center justify-between py-6">
        <h1 className="text-2xl font-normal text-[var(--md-sys-color-on-background)]">Transactions</h1>
        <button className="text-2xl">🔍</button>
      </div>

      {/* Filters Placeholder */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button className="px-4 py-2 bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] rounded-full text-xs font-bold whitespace-nowrap">ALL</button>
        <button className="px-4 py-2 bg-[var(--md-sys-color-surface-variant)] rounded-full text-xs font-bold whitespace-nowrap">SENT</button>
        <button className="px-4 py-2 bg-[var(--md-sys-color-surface-variant)] rounded-full text-xs font-bold whitespace-nowrap">RECEIVED</button>
        <button className="px-4 py-2 bg-[var(--md-sys-color-surface-variant)] rounded-full text-xs font-bold whitespace-nowrap">FAILED</button>
      </div>

      <div className="bg-white rounded-[28px] overflow-hidden shadow-sm border border-[var(--md-sys-color-surface-variant)]">
        {filteredTx.length > 0 ? (
          filteredTx.map((tx, index) => (
            <TransactionCard key={tx.id} tx={tx} />
          ))
        ) : (
          <div className="p-20 text-center opacity-40">
            <span className="text-4xl">🧾</span>
            <p className="mt-2 text-sm italic">No transactions found.</p>
          </div>
        )}
      </div>

      <div className="mt-10 text-center">
        <p className="text-xs text-[var(--md-sys-color-outline)]">Showing last 30 days of activity</p>
        <button className="mt-4 text-xs font-bold text-[var(--md-sys-color-primary)]">DOWNLOAD REPORT (CSV)</button>
      </div>
    </div>
  );
}
