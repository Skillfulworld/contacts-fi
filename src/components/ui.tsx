import Link from 'next/link';
import { ReactNode } from 'react';

// --- Avatar ---
export const Avatar = ({ initials, color, size = 'md' }: { initials: string; color: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) => {
  const sizeMap = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };
  return (
    <div className={`${sizeMap[size]} ${color} rounded-full flex items-center justify-center text-white font-medium shrink-0`}>
      {initials}
    </div>
  );
};

// --- Button ---
export const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const variantClass = variant === 'primary' ? 'md-button-primary' : 'md-button-tonal';
  return (
    <button className={`${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- Card ---
export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`md-card ${className}`}>
    {children}
  </div>
);

// --- Input ---
export const Input = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] ml-1">{label}</label>}
    <input className="md-input" {...props} />
  </div>
);

// --- SearchBar ---
export const SearchBar = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="sticky top-0 z-10 bg-[var(--md-sys-color-background)] pb-4">
    <div className="flex items-center bg-[var(--md-sys-color-surface-variant)] rounded-full px-4 py-2 gap-3 shadow-sm">
      <span className="text-xl">🔍</span>
      <input
        type="text"
        placeholder="Search contacts"
        className="bg-transparent border-none outline-none w-full py-2 text-[var(--md-sys-color-on-surface-variant)]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="text-xl">👤</span>
    </div>
  </div>
);

// --- WalletCard ---
export const WalletCard = ({ wallet }: { wallet: any }) => (
  <Card className="mb-3">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[var(--md-sys-color-surface-variant)] rounded-full flex items-center justify-center">
          🪙
        </div>
        <div>
          <div className="font-semibold">{wallet.name}</div>
          <div className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{wallet.provider} • {wallet.address}</div>
        </div>
      </div>
      {wallet.isDefault && (
        <span className="text-[10px] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] px-2 py-1 rounded-full font-bold uppercase">
          Default
        </span>
      )}
    </div>
  </Card>
);

// --- TransactionCard ---
export const TransactionCard = ({ tx }: { tx: any }) => (
  <div className="flex items-center justify-between p-4 border-b border-[var(--md-sys-color-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)]/30 transition-colors">
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'sent' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
        {tx.type === 'sent' ? '↑' : '↓'}
      </div>
      <div>
        <div className="font-medium">{tx.contact || 'Unknown'}</div>
        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{tx.date} • {tx.wallet}</div>
      </div>
    </div>
    <div className="text-right">
      <div className={`font-semibold ${tx.type === 'sent' ? 'text-[var(--md-sys-color-on-surface)]' : 'text-green-600'}`}>
        {tx.type === 'sent' ? '-' : '+'}{tx.amount}
      </div>
      <div className="text-[10px] uppercase font-bold text-[var(--md-sys-color-outline)]">{tx.status}</div>
    </div>
  </div>
);

// --- HealthBadge ---
export const HealthBadge = ({ label }: { label: string }) => {
  const colors: Record<string, string> = {
    'Verified': 'bg-green-100 text-green-800',
    'Smart Contract': 'bg-blue-100 text-blue-800',
    'Exchange': 'bg-purple-100 text-purple-800',
    'Fresh Wallet': 'bg-orange-100 text-orange-800',
    'Suspicious Activity': 'bg-red-100 text-red-800',
    'Active': 'bg-teal-100 text-teal-800',
    'EOA Wallet': 'bg-indigo-100 text-indigo-800',
  };
  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium ${colors[label] || 'bg-gray-100 text-gray-800'}`}>
      {label}
    </span>
  );
};

// --- SectionHeader ---
export const SectionHeader = ({ title, action }: { title: string; action?: ReactNode }) => (
  <div className="flex justify-between items-center mt-8 mb-4 px-1">
    <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--md-sys-color-outline)]">{title}</h3>
    {action}
  </div>
);

// --- BottomNavigation ---
export const BottomNavigation = () => (
  <div className="fixed bottom-0 left-0 w-full bg-[var(--md-sys-color-surface)] border-t border-[var(--md-sys-color-surface-variant)] px-6 py-3 flex justify-around items-center z-50">
    <Link href="/" className="flex flex-col items-center gap-1 group">
      <div className="px-5 py-1 rounded-full group-hover:bg-[var(--md-sys-color-secondary-container)] transition-colors">👤</div>
      <span className="text-[10px] font-medium">Contacts</span>
    </Link>
    <Link href="/transactions" className="flex flex-col items-center gap-1 group">
      <div className="px-5 py-1 rounded-full group-hover:bg-[var(--md-sys-color-secondary-container)] transition-colors">📊</div>
      <span className="text-[10px] font-medium">Transactions</span>
    </Link>
    <Link href="/settings" className="flex flex-col items-center gap-1 group">
      <div className="px-5 py-1 rounded-full group-hover:bg-[var(--md-sys-color-secondary-container)] transition-colors">⚙️</div>
      <span className="text-[10px] font-medium">Settings</span>
    </Link>
  </div>
);

// --- FAB ---
export const FAB = ({ href }: { href: string }) => (
  <Link href={href} className="md-fab">
    +
  </Link>
);
