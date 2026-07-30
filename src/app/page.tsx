"use client";
import { useState } from 'react';
import { useContacts } from '@/context/ContactContext';
import { Avatar, SearchBar, FAB, BottomNavigation } from '@/components/ui';
import Link from 'next/link';

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
      <div className="p-4 bg-[var(--md-sys-color-background)]">
        <div className="flex items-center justify-between py-6">
          <h1 className="text-3xl font-semibold text-[var(--md-sys-color-on-background)]">Contacts</h1>
          <div className="w-12 h-12 bg-[var(--md-sys-color-primary-container)] rounded-full flex items-center justify-center text-sm font-bold text-[var(--md-sys-color-on-primary-container)]">ME</div>
        </div>

        <SearchBar value={searchTerm} onChange={setSearchTerm} />
      </div>

      <div className="mt-4 px-2 space-y-8">
        {Object.keys(groups).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-24 h-24 bg-[var(--md-sys-color-surface-variant)] rounded-full flex items-center justify-center mb-6">
              <User className="w-12 h-12 text-[var(--md-sys-color-outline)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--md-sys-color-on-surface)]">No contacts</h3>
            <p className="text-sm text-[var(--md-sys-color-outline)] mt-2">Try a different search term or add a new contact to get started.</p>
          </div>
        ) : (
          Object.keys(groups).map((letter) => (
            <div key={letter} className="relative">
              <div className="sticky top-20 bg-[var(--md-sys-color-background)]/90 backdrop-blur-sm z-10 py-3 text-xs font-bold tracking-wider text-[var(--md-sys-color-primary)] ml-3">
                {letter}
              </div>
              <div className="space-y-1">
                {groups[letter].map((c: any) => (
                  <Link key={c.id} href={`/contacts/${c.id}`} className="flex items-center gap-4 p-4 rounded-3xl hover:bg-[var(--md-sys-color-surface-variant)]/50 transition-all group">
                    <Avatar initials={c.initials} color={c.color} />
                    <div className="flex-1">
                      <div className="font-semibold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors">{c.name}</div>
                      <div className="text-xs text-[var(--md-sys-color-outline)]">{c.defaultProvider}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <FAB href="/contacts/add" />
      <BottomNavigation />
    </div>
  );
}
// Add import User to the top
import { User } from 'lucide-react';
