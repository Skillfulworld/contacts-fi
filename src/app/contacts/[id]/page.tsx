"use client";
import { useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useContacts } from '@/context/ContactContext';
import { Avatar, Button, Card, WalletCard, TransactionCard, HealthBadge, SectionHeader } from '@/components/ui';
import Link from 'next/link';
import { ChevronLeft, Pencil, Trash2, Wallet, User } from 'lucide-react';

export default function ContactDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { contacts, deleteContact } = useContacts();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const contact = contacts.find((c: any) => c.id === params.id);
  
  if (!contact) notFound();

  const handleDelete = () => {
    deleteContact(contact.id);
    router.push('/');
  };

  return (
    <div className="pb-10 bg-[var(--md-sys-color-background)] min-h-screen">
      {/* Header / Backdrop */}
      <div className="h-48 bg-[var(--md-sys-color-secondary-container)] relative">
        <button onClick={() => router.back()} className="absolute top-6 left-4 bg-black/10 hover:bg-black/20 p-2 rounded-full transition-colors text-[var(--md-sys-color-on-secondary-container)]">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <Avatar initials={contact.initials} color={contact.color} size="xl" />
        </div>
      </div>

      <div className="mt-16 text-center px-4">
        <h1 className="text-3xl font-semibold text-[var(--md-sys-color-on-background)]">{contact.name}</h1>
        <div className="text-sm text-[var(--md-sys-color-outline)] mt-1 font-medium">{contact.defaultProvider}</div>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center gap-6 mt-8 px-4">
        <Link href={`/contacts/${contact.id}/edit`} className="flex flex-col items-center gap-2 group">
          <Button variant="tonal" className="!p-4 rounded-2xl"><Pencil className="w-5 h-5" /></Button>
          <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] group-hover:text-[var(--md-sys-color-primary)]">Edit</span>
        </Link>
        <button onClick={() => setShowDeleteConfirm(true)} className="flex flex-col items-center gap-2 group">
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl group-hover:bg-red-100 transition-colors"><Trash2 className="w-5 h-5" /></div>
          <span className="text-xs font-semibold text-red-600">Delete</span>
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--md-sys-color-surface)] p-8 rounded-[32px] w-full max-w-sm shadow-2xl">
            <h2 className="text-2xl font-semibold mb-4 text-[var(--md-sys-color-on-surface)]">Delete contact?</h2>
            <p className="text-[var(--md-sys-color-on-surface-variant)] mb-8">Are you sure you want to delete {contact.name}? This action cannot be undone.</p>
            <div className="flex gap-4">
              <Button className="flex-1" variant="tonal" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button className="flex-1 bg-red-600 text-white" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="px-4 mt-8 space-y-8">
        <SectionHeader title="Wallets" action={<Link href={`/contacts/${contact.id}/wallets/add`} className="text-xs font-bold text-[var(--md-sys-color-primary)] px-3 py-1 rounded-full bg-[var(--md-sys-color-primary-container)]">+ ADD</Link>} />
        {contact.wallets.map((w: any) => (
          <WalletCard key={w.id} wallet={w} />
        ))}

        <SectionHeader title="Address Health" />
        <Card className="bg-[var(--md-sys-color-surface-variant)]/30">
          <div className="flex flex-wrap gap-2 mb-4">
            {contact.health.map((h: string) => (
              <HealthBadge key={h} label={h} />
            ))}
          </div>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
            This address has been verified against the Arc Network registry and shows no suspicious activity in the last 90 days.
          </p>
        </Card>

        <SectionHeader title="Notes" />
        <Card className="bg-white">
          <p className="text-sm text-[var(--md-sys-color-on-surface)]">{contact.notes || "No notes added for this contact."}</p>
        </Card>

        <SectionHeader title="Recent Activity" />
        <Card className="!p-0 overflow-hidden">
          {contact.transactions.length > 0 ? (
            contact.transactions.map((t: any) => (
              <TransactionCard key={t.id} tx={{ ...t, contact: contact.name, wallet: contact.defaultProvider }} />
            ))
          ) : (
            <div className="p-8 text-center text-[var(--md-sys-color-outline)] text-sm">No recent transactions.</div>
          )}
        </Card>
      </div>
    </div>
  );
}
