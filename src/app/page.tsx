import { MOCK_CONTACTS } from '@/lib/mockData';
import { Avatar, FloatingActionButton } from '@/components/ui';
import Link from 'next/link';

export default function ContactsPage() {
  const sorted = [...MOCK_CONTACTS].sort((a, b) => a.name.localeCompare(b.name));
  
  return (
    <div className="p-4">
      <input type="text" placeholder="Search contacts" className="w-full p-4 mb-4 bg-surface-variant rounded-full" />
      
      {sorted.map(c => (
        <Link key={c.id} href={`/contacts/${c.id}`} className="flex items-center gap-4 p-3 hover:bg-surface-variant rounded-2xl">
          <Avatar name={c.name} color={c.color} />
          <div>
            <div className="font-medium text-lg">{c.name}</div>
            <div className="text-sm text-gray-500">{c.provider}</div>
          </div>
        </Link>
      ))}

      <FloatingActionButton href="/contacts/add" />
    </div>
  );
}
