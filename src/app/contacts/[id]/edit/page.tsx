"use client";
import { useState } from 'react';
import { useRouter, notFound } from 'next/navigation';
import { useContacts } from '@/context/ContactContext';
import { Button, Input, SectionHeader } from '@/components/ui';
import { X, PencilLine } from 'lucide-react';

export default function EditContactPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { contacts, updateContact } = useContacts();
  const contact = contacts.find((c: any) => c.id === params.id);

  if (!contact) notFound();

  const [name, setName] = useState(contact.name);
  const [notes, setNotes] = useState(contact.notes);

  const handleSave = () => {
    updateContact(contact.id, { name, notes });
    router.back();
  };

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-background)] p-4">
      <div className="flex items-center gap-4 py-6">
        <button onClick={() => router.back()} className="rounded-full border border-[#E5E7EB] bg-white p-2 text-[#1C1C1E] shadow-sm">
          <X className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-semibold text-[var(--md-sys-color-on-background)]">Edit contact</h1>
      </div>

      <div className="flex flex-col items-center py-4">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#EDEBFF] text-[#6D5DF6] shadow-sm">
          <PencilLine className="h-10 w-10" />
        </div>
      </div>

      <div className="space-y-6 rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[0_8px_24px_rgba(17,24,39,0.06)]">
        <Input label="Full name" value={name} onChange={(e: any) => setName(e.target.value)} />
        <SectionHeader title="Contact Info" />
        <Input label="Notes" value={notes} onChange={(e: any) => setNotes(e.target.value)} />

        <div className="pt-4">
          <Button className="w-full !text-base" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
