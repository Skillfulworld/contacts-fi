"use client";
import { useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useContacts } from '@/context/ContactContext';
import { Avatar, Button, Card, WalletCard, TransactionCard, HealthBadge, SectionHeader } from '@/components/ui';
import { SendFlow } from '@/components/SendFlow';
import Link from 'next/link';
import { ChevronLeft, Pencil, Trash2, ShieldCheck, Send } from 'lucide-react';

export default function ContactDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { contacts, deleteContact, addTransaction } = useContacts();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSendFlow, setShowSendFlow] = useState(false);
  const contact = contacts.find((c: any) => c.id === params.id);

  if (!contact) notFound();

  const handleDelete = () => {
    deleteContact(contact.id);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-background)] pb-10">
      <div className="relative h-44 bg-[#EDEBFF]">
        <button onClick={() => router.back()} className="absolute left-4 top-6 rounded-full bg-white/80 p-2 text-[#1C1C1E] shadow-sm transition-all duration-200 hover:bg-white">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
          <Avatar initials={contact.initials} color={contact.color} size="xl" />
        </div>
      </div>

      <div className="px-4 pt-14 text-center">
        <h1 className="text-2xl font-semibold text-[var(--md-sys-color-on-background)]">{contact.name}</h1>
        <div className="mt-1 text-sm font-medium text-[#6B7280]">{contact.defaultProvider}</div>
      </div>

      <div className="mt-8 flex justify-center gap-6 px-4">
        <button onClick={() => setShowSendFlow(true)} className="flex flex-col items-center gap-2 group">
          <div className="rounded-2xl bg-[#EDEBFF] p-4 text-[#6D5DF6] transition-colors group-hover:bg-[#DDD7FF]"><Send className="h-4 w-4" /></div>
          <span className="text-xs font-semibold text-[#6B7280] group-hover:text-[#6D5DF6]">Send</span>
        </button>
        <Link href={`/contacts/${contact.id}/edit`} className="flex flex-col items-center gap-2 group">
          <Button variant="tonal" className="!p-4 rounded-2xl"><Pencil className="h-4 w-4" /></Button>
          <span className="text-xs font-semibold text-[#6B7280] group-hover:text-[#6D5DF6]">Edit</span>
        </Link>
        <button onClick={() => setShowDeleteConfirm(true)} className="flex flex-col items-center gap-2 group">
          <div className="rounded-2xl bg-[#FDECEC] p-4 text-[#D64545] transition-colors group-hover:bg-[#F9D7D7]"><Trash2 className="h-4 w-4" /></div>
          <span className="text-xs font-semibold text-[#D64545]">Delete</span>
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-[32px] border border-[#E5E7EB] bg-white p-8 shadow-[0_16px_40px_rgba(17,24,39,0.16)]">
            <h2 className="mb-3 text-2xl font-semibold text-[#1C1C1E]">Delete contact?</h2>
            <p className="mb-8 text-sm leading-6 text-[#6B7280]">Are you sure you want to delete {contact.name}? This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button className="flex-1" variant="tonal" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button className="flex-1 bg-[#D64545] text-white" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {showSendFlow && (
        <SendFlow
          recipient={{ name: contact.name, wallets: contact.wallets }}
          onClose={() => setShowSendFlow(false)}
          onTransactionComplete={(tx) => {
            addTransaction({
              ...tx,
              contactId: contact.id,
              type: 'sent',
              contact: contact.name,
              date: 'Just now',
              wallet: contact.defaultProvider,
            });
            setShowSendFlow(false);
          }}
        />
      )}

      <div className="mt-8 space-y-8 px-4">
        <SectionHeader title="Wallets" action={<Link href={`/contacts/${contact.id}/wallets/add`} className="rounded-full bg-[#EDEBFF] px-3 py-1 text-[11px] font-semibold text-[#6D5DF6]">+ Add</Link>} />
        {contact.wallets.map((w: any) => (
          <WalletCard key={w.id} wallet={w} />
        ))}

        <SectionHeader title="Address Health" />
        <Card>
          <div className="mb-4 flex flex-wrap gap-2">
            {contact.health.map((h: string) => (
              <HealthBadge key={h} label={h} />
            ))}
          </div>
          <div className="flex items-start gap-2 text-sm leading-6 text-[#6B7280]">
            <ShieldCheck className="mt-1 h-4 w-4 text-[#4DA3FF]" />
            <span>This address has been verified against the Arc Network registry and shows no suspicious activity in the last 90 days.</span>
          </div>
        </Card>

        <SectionHeader title="Notes" />
        <Card>
          <p className="text-sm leading-6 text-[#1C1C1E]">{contact.notes || 'No notes added for this contact.'}</p>
        </Card>

        <SectionHeader title="Recent Activity" />
        <Card className="!p-0 overflow-hidden">
          {contact.transactions.length > 0 ? (
            contact.transactions.map((t: any) => (
              <TransactionCard key={t.id} tx={{ ...t, contact: contact.name, wallet: contact.defaultProvider }} />
            ))
          ) : (
            <div className="p-8 text-center text-sm text-[#6B7280]">No recent transactions.</div>
          )}
        </Card>
      </div>
    </div>
  );
}
