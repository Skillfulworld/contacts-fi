"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useContacts } from '@/context/ContactContext';
import { Button, Input, SectionHeader } from '@/components/ui';
import { X, UserPlus } from 'lucide-react';

export default function AddContactPage() {
  const router = useRouter();
  const { addContact } = useContacts();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;
    addContact({ name, notes });
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-background)] p-4">
      <div className="flex items-center gap-4 py-6">
        <button onClick={() => router.back()} className="rounded-full border border-[#E5E7EB] bg-white p-2 text-[#1C1C1E] shadow-sm">
          <X className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-semibold text-[var(--md-sys-color-on-background)]">Create contact</h1>
      </div>

      <div className="flex flex-col items-center py-8">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#EDEBFF] text-[#6D5DF6] shadow-sm">
          <UserPlus className="h-12 w-12" />
        </div>
      </div>

      <div className="space-y-6 rounded-[32px] border border-[#E5E7EB] bg-white p-5 shadow-[0_8px_24px_rgba(17,24,39,0.06)]">
        <Input label="Full name" placeholder="e.g. Alice Johnson" value={name} onChange={(e: any) => setName(e.target.value)} />

        <SectionHeader title="Contact Info" />
        <Input label="Notes" placeholder="Additional details..." value={notes} onChange={(e: any) => setNotes(e.target.value)} />

        <div className="pt-4">
          <Button className="w-full !text-base" onClick={handleSave}>
            Save Contact
          </Button>
        </div>
      </div>
    </div>
  );
}
