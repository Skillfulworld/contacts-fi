"use client";
import { useState } from 'react';
import { useContacts } from '@/context/ContactContext';
import { Avatar, SearchBar, FAB } from '@/components/ui';
import Link from 'next/link';

export default function ContactsListPage() {
  const { contacts } = useContacts();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  const groups = filteredContacts.reduce((acc, contact) => {
    const letter = contact.name[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(contact);
    return acc;
  }, {} as Record<string, typeof contacts>);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between py-6">
        <h1 className="text-2xl font-normal text-[var(--md-sys-color-on-background)]">Contacts</h1>
        <div className="w-10 h-10 bg-[var(--md-sys-color-primary-container)] rounded-full flex items-center justify-center text-xs font-bold">ME</div>
      </div>

      <SearchBar value={searchTerm} onChange={setSearchTerm} />

      <div className="mt-4 space-y-8">
        {Object.keys(groups).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-6xl mb-4 opacity-20">👤</span>
            <h3 className="text-lg font-medium opacity-60">No contacts found</h3>
            <p className="text-sm opacity-40">Try a different search term or add a new contact.</p>
          </div>
        ) : (
          Object.entries(groups).map(([letter, contacts]) => (
            <div key={letter} className="relative">
              <div className="sticky top-16 bg-[var(--md-sys-color-background)] z-10 py-2 text-sm font-bold text-[var(--md-sys-color-primary)] ml-1">
                {letter}
              </div>
              <div className="mt-2 space-y-1">
                {contacts.map(c => (
                  <Link key={c.id} href={`/contacts/${c.id}`} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-[var(--md-sys-color-surface-variant)] transition-all group">
                    <Avatar initials={c.initials} color={c.color} />
                    <div className="flex-1">
                      <div className="font-medium text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors">{c.name}</div>
                      <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{c.defaultProvider}</div>
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
