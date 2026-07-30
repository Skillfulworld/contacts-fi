import Link from 'next/link';
import { ReactNode } from 'react';
import { 
  Search, 
  User, 
  Plus, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Settings, 
  LayoutDashboard,
  MoreVertical,
  ChevronLeft,
  Pencil,
  Trash2,
  Copy,
  Share2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// --- Avatar ---
export const Avatar = ({ initials, color, size = 'md' }: { initials: string; color: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) => {
  const sizeMap = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };
  return (
    <div className={`${sizeMap[size]} ${color} rounded-full flex items-center justify-center text-white font-medium shrink-0 shadow-sm`}>
      {initials}
    </div>
  );
};

// --- Button ---
export const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const variantClass = variant === 'primary' 
    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:shadow-md' 
    : 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:bg-[var(--md-sys-color-surface-variant)]';
  
  return (
    <button className={`px-6 py-3 rounded-full font-medium transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- Card ---
export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`bg-white rounded-3xl p-5 shadow-sm border border-[var(--md-sys-color-outline-variant)]/20 ${className}`}>
    {children}
  </div>
);

// --- Input ---
export const Input = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] ml-1">{label}</label>}
    <input className="bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] px-4 py-4 rounded-2xl border border-transparent focus:border-[var(--md-sys-color-primary)] outline-none transition-all w-full" {...props} />
  </div>
);

// --- SearchBar ---
export const SearchBar = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="sticky top-0 z-10 bg-[var(--md-sys-color-background)] pb-2 pt-2">
    <div className="flex items-center bg-[var(--md-sys-color-surface-variant)] rounded-full px-5 py-3 gap-3 shadow-inner">
      <Search className="w-5 h-5 text-[var(--md-sys-color-outline)]" />
      <input
        type="text"
        placeholder="Search contacts"
        className="bg-transparent border-none outline-none w-full text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-outline)]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  </div>
);

// --- WalletCard ---
export const WalletCard = ({ wallet }: { wallet: any }) => {
  const providerColors: Record<string, string> = {
    'Bitget Wallet': 'text-purple-600 bg-purple-100',
    'MetaMask': 'text-orange-600 bg-orange-100',
    'Phantom': 'text-indigo-600 bg-indigo-100',
  };
  const color = providerColors[wallet.provider] || 'text-gray-600 bg-gray-100';

  return (
    <Card className="mb-3 flex justify-between items-center hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <div className="font-semibold text-[var(--md-sys-color-on-surface)]">{wallet.name}</div>
          <div className="text-xs text-[var(--md-sys-color-outline)]">{wallet.provider} • {wallet.address}</div>
        </div>
      </div>
      {wallet.isDefault && (
        <span className="text-[10px] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] px-3 py-1 rounded-full font-bold uppercase tracking-wider">
          Default
        </span>
      )}
    </Card>
  );
};

// --- TransactionCard ---
export const TransactionCard = ({ tx }: { tx: any }) => (
  <div className="flex items-center justify-between p-4 border-b border-[var(--md-sys-color-outline-variant)]/20 last:border-0 hover:bg-slate-50 transition-colors">
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'sent' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
        {tx.type === 'sent' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
      </div>
      <div>
        <div className="font-medium text-[var(--md-sys-color-on-surface)]">{tx.contact || 'Unknown'}</div>
        <div className="text-xs text-[var(--md-sys-color-outline)]">{tx.date} • {tx.wallet}</div>
      </div>
    </div>
    <div className="text-right">
      <div className={`font-semibold ${tx.type === 'sent' ? 'text-[var(--md-sys-color-on-surface)]' : 'text-green-700'}`}>
        {tx.type === 'sent' ? '-' : '+'}{tx.amount}
      </div>
      <div className={`text-[10px] uppercase font-bold ${tx.status === 'Success' ? 'text-green-600' : 'text-red-600'}`}>{tx.status}</div>
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
    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--md-sys-color-outline)]">{title}</h3>
    {action}
  </div>
);

// --- BottomNavigation ---
export const BottomNavigation = () => (
  <div className="fixed bottom-0 left-0 w-full bg-[var(--md-sys-color-surface)] border-t border-[var(--md-sys-color-outline-variant)]/20 px-6 py-2 flex justify-around items-center z-50">
    <Link href="/" className="flex flex-col items-center gap-1 group text-[var(--md-sys-color-on-surface-variant)]">
      <div className="px-6 py-1 rounded-full group-hover:bg-[var(--md-sys-color-secondary-container)] transition-colors"><User className="w-6 h-6" /></div>
      <span className="text-[10px] font-medium">Contacts</span>
    </Link>
    <Link href="/transactions" className="flex flex-col items-center gap-1 group text-[var(--md-sys-color-on-surface-variant)]">
      <div className="px-6 py-1 rounded-full group-hover:bg-[var(--md-sys-color-secondary-container)] transition-colors"><LayoutDashboard className="w-6 h-6" /></div>
      <span className="text-[10px] font-medium">Transactions</span>
    </Link>
    <Link href="/settings" className="flex flex-col items-center gap-1 group text-[var(--md-sys-color-on-surface-variant)]">
      <div className="px-6 py-1 rounded-full group-hover:bg-[var(--md-sys-color-secondary-container)] transition-colors"><Settings className="w-6 h-6" /></div>
      <span className="text-[10px] font-medium">Settings</span>
    </Link>
  </div>
);

// --- FAB ---
export const FAB = ({ href }: { href: string }) => (
  <Link href={href} className="fixed bottom-24 right-6 w-14 h-14 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-2xl shadow-lg flex items-center justify-center text-2xl hover:bg-[var(--md-sys-color-primary)]/90 transition-all hover:scale-105 active:scale-90">
    <Plus className="w-7 h-7" />
  </Link>
);
