"use client";
import { useState } from 'react';
import { useRouter, notFound } from 'next/navigation';
import { useContacts } from '@/context/ContactContext';
import { Button, Input, SectionHeader } from '@/components/ui';
import { X } from 'lucide-react';

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
    <div className="p-4 bg-[var(--md-sys-color-background)] min-h-screen">
      <div className="flex items-center gap-4 py-6">
        <button onClick={() => router.back()} className="text-[var(--md-sys-color-on-background)]"><X className="w-7 h-7" /></button>
        <h1 className="text-2xl font-semibold text-[var(--md-sys-color-on-background)]">Edit contact</h1>
      </div>

      <div className="space-y-6">
        <Input label="Full name" value={name} onChange={(e: any) => setName(e.target.value)} />
        <SectionHeader title="Contact Info" />
        <Input label="Notes" value={notes} onChange={(e: any) => setNotes(e.target.value)} />

        <div className="pt-8">
          <Button className="w-full !text-base" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
