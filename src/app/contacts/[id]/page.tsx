import { MOCK_CONTACTS } from '@/lib/mockData';
import { Avatar } from '@/components/ui';
import { notFound } from 'next/navigation';

export default function ContactDetailsPage({ params }: { params: { id: string } }) {
  const contact = MOCK_CONTACTS.find(c => c.id === params.id);
  if (!contact) notFound();

  return (
    <div className="p-4">
      <div className="flex flex-col items-center py-8">
        <Avatar name={contact.name} color={contact.color} size="lg" />
        <h1 className="text-3xl font-bold mt-4">{contact.name}</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <button className="bg-primary-color text-white py-3 rounded-full">Send USDC</button>
        <button className="bg-surface-variant py-3 rounded-full">Copy Addr</button>
      </div>

      <h2 className="font-semibold mb-2">Wallets</h2>
      <div className="bg-white p-4 rounded-3xl shadow-sm border mb-6">
        <div className="flex justify-between">
          <div>
            <div className="font-medium">{contact.provider}</div>
            <div className="text-sm text-gray-500">0x5D4A...F213</div>
          </div>
          <span className="text-xs bg-surface-variant px-2 py-1 rounded-full">Default</span>
        </div>
      </div>

      <h2 className="font-semibold mb-2">Address Health</h2>
      <div className="bg-white p-4 rounded-3xl shadow-sm border">
        <div className="text-sm">✓ Verified Address</div>
        <div className="text-sm">✓ Active</div>
      </div>
    </div>
  );
}
