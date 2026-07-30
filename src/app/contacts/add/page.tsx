"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useContacts } from '@/context/ContactContext';
import { Button, Input, SectionHeader } from '@/components/ui';

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
    <div className="p-4">
      <div className="flex items-center gap-4 py-6">
        <button onClick={() => router.back()} className="text-2xl">✖️</button>
        <h1 className="text-2xl font-normal">Create contact</h1>
      </div>

      <div className="flex flex-col items-center py-8">
        <div className="w-24 h-24 bg-[var(--md-sys-color-primary-container)] rounded-full flex items-center justify-center text-4xl mb-4">
          👤
        </div>
      </div>

      <div className="space-y-6">
        <Input label="Full name" placeholder="e.g. Alice Johnson" value={name} onChange={(e: any) => setName(e.target.value)} />
        
        <SectionHeader title="Contact Info" />
        <Input label="Notes" placeholder="Additional details..." value={notes} onChange={(e: any) => setNotes(e.target.value)} />

        <div className="pt-8">
          <Button className="w-full" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
