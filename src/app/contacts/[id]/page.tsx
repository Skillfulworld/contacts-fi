"use client";
import { useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useContacts } from '@/context/ContactContext';
import { Avatar, Button, Card, WalletCard, TransactionCard, HealthBadge, SectionHeader } from '@/components/ui';
import Link from 'next/link';

export default function ContactDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { contacts, deleteContact } = useContacts();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const contact = contacts.find(c => c.id === params.id);
  
  if (!contact) notFound();

  const handleDelete = () => {
    deleteContact(contact.id);
    router.push('/');
  };

  return (
    <div className="pb-10">
      {/* Header / Backdrop */}
      <div className="h-48 bg-[var(--md-sys-color-secondary-container)] relative">
        <button onClick={() => router.back()} className="absolute top-6 left-4 bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors">
          ⬅️
        </button>
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <Avatar initials={contact.initials} color={contact.color} size="xl" />
        </div>
      </div>

      <div className="mt-16 text-center px-4">
        <h1 className="text-3xl font-normal text-[var(--md-sys-color-on-background)]">{contact.name}</h1>
        <div className="text-sm text-[var(--md-sys-color-outline)] mt-1">{contact.defaultProvider}</div>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center gap-4 mt-8 px-4">
        <Link href={`/contacts/${contact.id}/edit`} className="flex flex-col items-center gap-2">
          <Button variant="tonal" className="!p-4 rounded-2xl">✏️</Button>
          <span className="text-xs font-medium">Edit</span>
        </Link>
        <button onClick={() => setShowDeleteConfirm(true)} className="flex flex-col items-center gap-2">
          <div className="bg-red-100 text-red-600 p-4 rounded-2xl">🗑️</div>
          <span className="text-xs font-medium text-red-600">Delete</span>
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--md-sys-color-surface)] p-6 rounded-3xl w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-medium mb-4">Delete contact?</h2>
            <p className="text-[var(--md-sys-color-on-surface-variant)] mb-8">Are you sure you want to delete {contact.name}? This action cannot be undone.</p>
            <div className="flex gap-4">
              <Button className="flex-1" variant="tonal" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button className="flex-1 bg-red-600" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Wallets Section */}
      <div className="px-4 mt-8">
        <SectionHeader 
          title="Wallets" 
          action={<Link href={`/contacts/${contact.id}/wallets/add`} className="text-xs font-bold text-[var(--md-sys-color-primary)]">+ ADD</Link>} 
        />
        {contact.wallets.map((w: any) => (
          <WalletCard key={w.id} wallet={w} />
        ))}

        {/* Address Health */}
        <SectionHeader title="Address Health" />
        <Card className="!p-6 bg-green-50/50">
          <div className="flex flex-wrap gap-2">
            {contact.health.map((h: string) => (
              <HealthBadge key={h} label={h} />
            ))}
          </div>
          <p className="text-xs text-[var(--md-sys-color-outline)] mt-4 leading-relaxed">
            This address has been verified against the Arc Network registry and shows no suspicious activity in the last 90 days.
          </p>
        </Card>

        {/* Notes */}
        <SectionHeader title="Notes" />
        <Card className="bg-[var(--md-sys-color-surface-variant)]/50 !rounded-2xl">
          <p className="text-sm italic opacity-70">{contact.notes || "No notes added for this contact."}</p>
        </Card>

        {/* Transactions */}
        <SectionHeader title="Recent Activity" />
        <Card className="!p-0 overflow-hidden">
          {contact.transactions.length > 0 ? (
            contact.transactions.map((t: any) => (
              <TransactionCard key={t.id} tx={{ ...t, contact: contact.name, wallet: contact.defaultProvider }} />
            ))
          ) : (
            <div className="p-8 text-center opacity-40 text-sm italic">No recent transactions.</div>
          )}
        </Card>
      </div>
    </div>
  );
}
