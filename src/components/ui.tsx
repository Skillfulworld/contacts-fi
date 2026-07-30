import Link from 'next/link';

export const Avatar = ({ name, color, size = 'md' }: { name: string; color: string; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = size === 'lg' ? 'w-24 h-24 text-4xl' : size === 'md' ? 'w-12 h-12 text-xl' : 'w-8 h-8 text-sm';
  return (
    <div className={`${sizeClasses} ${color} rounded-full flex items-center justify-center text-white font-medium`}>
      {name.charAt(0)}
    </div>
  );
};

export const FloatingActionButton = ({ href }: { href: string }) => (
  <Link href={href} className="fixed bottom-6 right-6 w-14 h-14 bg-primary-color text-white rounded-2xl shadow-lg flex items-center justify-center text-2xl">
    +
  </Link>
);
