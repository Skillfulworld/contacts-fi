"use client";
import { useState } from 'react';
import { useContacts } from '@/context/ContactContext';
import { Avatar, SearchBar, FAB } from '@/components/ui';
import Link from 'next/link';
import { Contact2, SearchX } from 'lucide-react';

export default function ContactsListPage() {
  const { contacts } = useContacts();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = contacts.filter((c: any) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a: any, b: any) => a.name.localeCompare(b.name));

  const groups = filteredContacts.reduce((acc: Record<string, any[]>, contact: any) => {
    const letter = contact.name[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(contact);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="pb-32">
      <div className="bg-[var(--md-sys-color-background)] px-4 pb-3 pt-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6B7280]">
              <Contact2 className="h-3.5 w-3.5" />
              Contacts-Fi
            </div>
            <h1 className="text-2xl font-semibold text-[var(--md-sys-color-on-background)]">The Contacts app for crypto</h1>
          </div>
        </div>

        <SearchBar value={searchTerm} onChange={setSearchTerm} />
      </div>

      <div className="mt-4 space-y-8 px-2">
        {Object.keys(groups).length === 0 ? (
          <div className="mx-2 flex flex-col items-center justify-center rounded-[32px] border border-[#E5E7EB] bg-white px-6 py-16 text-center shadow-[0_8px_24px_rgba(17,24,39,0.06)]">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#EDEBFF] text-[#6D5DF6]">
              <SearchX className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--md-sys-color-on-surface)]">No contacts found</h3>
            <p className="mt-2 text-sm text-[#6B7280]">Try a different search term or add a new contact to get started.</p>
          </div>
        ) : (
          Object.keys(groups).map((letter) => (
            <div key={letter} className="relative">
              <div className="sticky top-20 z-10 ml-3 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6B7280]">
                {letter}
              </div>
              <div className="space-y-2">
                {groups[letter].map((c: any) => (
                  <Link key={c.id} href={`/contacts/${c.id}`} className="flex items-center gap-4 rounded-[24px] border border-[#E5E7EB] bg-white p-4 shadow-[0_6px_18px_rgba(17,24,39,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(17,24,39,0.08)]">
                    <Avatar initials={c.initials} color={c.color} />
                    <div className="flex-1">
                      <div className="font-semibold text-[var(--md-sys-color-on-surface)]">{c.name}</div>
                      <div className="text-sm text-[#6B7280]">{c.defaultProvider}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <FAB href="/contacts/add" />
    </div>
  );
}
