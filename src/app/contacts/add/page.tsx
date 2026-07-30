"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useContacts } from '@/context/ContactContext';
import { Button, Input, SectionHeader } from '@/components/ui';
import { X, User } from 'lucide-react';

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
    <div className="p-4 bg-[var(--md-sys-color-background)] min-h-screen">
      <div className="flex items-center gap-4 py-6">
        <button onClick={() => router.back()} className="text-[var(--md-sys-color-on-background)]"><X className="w-7 h-7" /></button>
        <h1 className="text-2xl font-semibold text-[var(--md-sys-color-on-background)]">Create contact</h1>
      </div>

      <div className="flex flex-col items-center py-8">
        <div className="w-28 h-28 bg-[var(--md-sys-color-primary-container)] rounded-full flex items-center justify-center text-[var(--md-sys-color-on-primary-container)] mb-6 shadow-sm">
          <User className="w-14 h-14" />
        </div>
      </div>

      <div className="space-y-6">
        <Input label="Full name" placeholder="e.g. Alice Johnson" value={name} onChange={(e: any) => setName(e.target.value)} />
        
        <SectionHeader title="Contact Info" />
        <Input label="Notes" placeholder="Additional details..." value={notes} onChange={(e: any) => setNotes(e.target.value)} />

        <div className="pt-8">
          <Button className="w-full !text-base" onClick={handleSave}>
            Save Contact
          </Button>
        </div>
      </div>
    </div>
  );
}
