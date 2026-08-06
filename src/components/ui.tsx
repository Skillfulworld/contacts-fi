"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Search,
  User,
  Plus,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Settings,
  LayoutDashboard,
  ChevronLeft,
  Pencil,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle,
  CircleDollarSign,
  ShieldCheck,
  ReceiptText,
  Contact2,
  ArrowLeftRight,
} from 'lucide-react';
import { getChainDisplayName, useWallet } from '@/context/WalletContext';

// --- Avatar ---
export const Avatar = ({ initials, color, size = 'md' }: { initials: string; color?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) => {
  const sizeMap = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };

  const palette = ['#6D5DF6', '#4DA3FF', '#FF7A59', '#22C55E'];
  const fallbackColor = palette[initials.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % palette.length];
  const resolvedColor = color && color.startsWith('#') ? color : (color && color.startsWith('bg-') ? undefined : color) || fallbackColor;

  return (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center text-white font-semibold shrink-0 shadow-sm`}
      style={{ backgroundColor: typeof resolvedColor === 'string' && resolvedColor.startsWith('#') ? resolvedColor : fallbackColor }}
    >
      {initials}
    </div>
  );
};

// --- BrandLogo ---
export const BrandLogo = () => (
  <Link href="/" className="flex items-center gap-2 font-semibold text-[#1C1C1E] hover:text-[#6D5DF6] transition-colors">
    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#EDEBFF] text-[#6D5DF6]">
      <CircleDollarSign className="h-4 w-4" />
    </div>
    <span className="text-sm">ContactFi</span>
  </Link>
);

// --- WalletHeader ---
export const WalletHeader = () => {
  const { isConnected, isConnecting, walletAddress, walletName, chainId, connectWallet, disconnectWallet, switchToArcTestnet } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setMenuOpen(false);
    } catch (error) {
      console.error('Failed to copy address', error);
    }
  };

  const handleSwitchNetwork = async () => {
    setSwitchError(null);
    const result = await switchToArcTestnet();
    if (!result.ok) {
      setSwitchError(result.error || 'Unable to switch network.');
    } else {
      setMenuOpen(false);
    }
  };

  const isArcTestnet = chainId?.trim().toLowerCase() === '0x4cef52' || chainId === '5042002';

  if (isConnected) {
    return (
      <div ref={buttonRef} className="relative z-50">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-[#F3F4F6] px-3 py-2 shadow-[0_8px_24px_rgba(17,24,39,0.06)]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EDEBFF] text-[#6D5DF6]">
            <Wallet className="h-4 w-4" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-[#1C1C1E]">{walletName || 'Connected Wallet'}</div>
            <div className="text-xs text-[#6B7280]">{walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connected'}</div>
          </div>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-14 z-50 w-56 rounded-2xl border border-[#E5E7EB] bg-[#F5F6F8] p-2 shadow-[0_14px_36px_rgba(17,24,39,0.12)]">
            <div className="mb-2 px-2 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#6B7280]">
              {isArcTestnet ? '🟣 Arc Testnet' : '🔴 Wrong Network'}
            </div>
            <div className="mb-2 px-2 text-sm font-medium text-[#1C1C1E]">
              {isArcTestnet ? 'Connected' : `Current Chain: ${getChainDisplayName(chainId)}`}
            </div>
            <div className="mb-2 break-all px-2 text-xs text-[#6B7280]">
              {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connected'}
            </div>
            <button onClick={handleCopy} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#1C1C1E] hover:bg-[#F3F4F6]">
              <Copy className="h-4 w-4" />
              Copy Address
            </button>
            {!isArcTestnet && (
              <button onClick={handleSwitchNetwork} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#6D5DF6] hover:bg-[#EDEBFF]">
                <Wallet className="h-4 w-4" />
                Switch to Arc Testnet
              </button>
            )}
            <button onClick={() => { disconnectWallet(); setMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#D64545] hover:bg-[#FDECEC]">
              <Wallet className="h-4 w-4" />
              Disconnect
            </button>
            {switchError && (
              <div className="mt-2 rounded-xl border border-[#F9D7D7] bg-[#FDECEC] px-3 py-2 text-xs text-[#6B1F1F]">
                {switchError}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => connectWallet()}
      className="rounded-full bg-[#6D5DF6] px-5 py-3 font-semibold text-white shadow-[0_10px_24px_rgba(109,93,246,0.18)] transition-all duration-200 active:scale-[0.98]"
      disabled={isConnecting}
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
};

// --- Button ---
export const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const variantClass = variant === 'primary'
    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-[0_10px_24px_rgba(109,93,246,0.16)]'
    : variant === 'tonal'
      ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
      : 'bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]';

  return (
    <button className={`px-5 py-3 rounded-2xl font-semibold transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- Card ---
export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-[28px] border border-[#E5E7EB] bg-white p-5 shadow-[0_8px_24px_rgba(17,24,39,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(17,24,39,0.08)] ${className}`}>
    {children}
  </div>
);

// --- Input ---
export const Input = ({ label, ...props }: any) => (
  <div className="flex w-full flex-col gap-2">
    {label && <label className="ml-1 text-sm font-medium text-[#6B7280]">{label}</label>}
    <input className="w-full rounded-2xl border border-[#E5E7EB] bg-[#F5F6F8] px-4 py-3 text-[var(--md-sys-color-on-surface)] outline-none transition-all duration-200 focus:border-[var(--md-sys-color-primary)]" {...props} />
  </div>
);

// --- SearchBar ---
export const SearchBar = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="sticky top-0 z-10 bg-[var(--md-sys-color-background)] pb-2 pt-2">
    <div className="flex items-center gap-3 rounded-[20px] border border-[#E5E7EB] bg-[#F5F6F8] px-4 py-3 shadow-[0_6px_18px_rgba(17,24,39,0.04)]">
      <Search className="h-5 w-5 text-[#6B7280]" />
      <input
        type="text"
        placeholder="Search contacts"
        className="w-full border-none bg-transparent text-[var(--md-sys-color-on-surface)] outline-none placeholder:text-[#6B7280]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  </div>
);

// --- WalletCard ---
export const WalletCard = ({ wallet }: { wallet: any }) => {
  const providerColors: Record<string, string> = {
    'Bitget Wallet': 'text-[#6D5DF6] bg-[#EDEBFF]',
    'MetaMask': 'text-[#FF7A59] bg-[#FFF0EA]',
    'Phantom': 'text-[#4DA3FF] bg-[#EAF4FF]',
  };
  const color = providerColors[wallet.provider] || 'text-[#6B7280] bg-[#F3F4F6]';

  return (
    <Card className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
          <Wallet className="h-6 w-6" />
        </div>
        <div>
          <div className="font-semibold text-[var(--md-sys-color-on-surface)]">{wallet.name}</div>
          <div className="text-xs text-[#6B7280]">{wallet.provider} • {wallet.address}</div>
        </div>
      </div>
      {wallet.isDefault && (
        <span className="rounded-full bg-[var(--md-sys-color-primary-container)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-primary-container)]">
          Default
        </span>
      )}
    </Card>
  );
};

// --- TransactionCard ---
export const TransactionCard = ({ tx }: { tx: any }) => (
  <div className="flex items-center justify-between border-b border-[#E5E7EB] p-4 last:border-0 transition-colors hover:bg-[#F9FAFB]">
    <div className="flex items-center gap-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tx.type === 'sent' ? 'bg-[#FDECEC] text-[#D64545]' : 'bg-[#EAF4FF] text-[#4DA3FF]'}`}>
        {tx.type === 'sent' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
      </div>
      <div>
        <div className="font-medium text-[var(--md-sys-color-on-surface)]">{tx.contact || 'Unknown'}</div>
        <div className="text-xs text-[#6B7280]">{tx.date} • {tx.wallet}</div>
      </div>
    </div>
    <div className="text-right">
      <div className={`font-semibold ${tx.type === 'sent' ? 'text-[var(--md-sys-color-on-surface)]' : 'text-[#4DA3FF]'}`}>
        {tx.type === 'sent' ? '-' : '+'}{tx.amount}
      </div>
      <div className={`text-[10px] font-semibold uppercase ${tx.status === 'Success' ? 'text-[#4DA3FF]' : 'text-[#D64545]'}`}>{tx.status}</div>
    </div>
  </div>
);

// --- HealthBadge ---
export const HealthBadge = ({ label }: { label: string }) => {
  const colors: Record<string, string> = {
    Verified: 'bg-[#EAF4FF] text-[#1C4C80]',
    'Smart Contract': 'bg-[#EDEBFF] text-[#2F2A6B]',
    Exchange: 'bg-[#FFF0EA] text-[#8A3B1E]',
    'Fresh Wallet': 'bg-[#FFF0EA] text-[#8A3B1E]',
    'Suspicious Activity': 'bg-[#FDECEC] text-[#6B1F1F]',
    Active: 'bg-[#EAF4FF] text-[#1C4C80]',
    'EOA Wallet': 'bg-[#EDEBFF] text-[#2F2A6B]',
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${colors[label] || 'bg-[#F3F4F6] text-[#6B7280]'}`}>
      {label}
    </span>
  );
};

// --- SectionHeader ---
export const SectionHeader = ({ title, action }: { title: string; action?: ReactNode }) => (
  <div className="mb-3 mt-8 flex items-center justify-between px-1">
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6B7280]">{title}</h3>
    {action}
  </div>
);

// --- BottomNavigation ---
export const BottomNavigation = () => {
  const pathname = usePathname();
  const links = [
    { href: '/contacts', label: 'Contacts', icon: User },
    { href: '/send', label: 'Send', icon: ArrowUpRight },
    { href: '/swap', label: 'Swap', icon: ArrowLeftRight },
    { href: '/transactions', label: 'Activity', icon: ReceiptText },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-[#334155] bg-[#1E293B] px-4 py-2 shadow-[0_-10px_24px_rgba(15,23,42,0.24)] backdrop-blur">
      {links.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link key={href} href={href} className={`flex flex-col items-center gap-1 rounded-2xl px-4 py-2 transition-all duration-200 ${isActive ? 'bg-[#6F3FF5]/15 text-[#6F3FF5]' : 'text-[#F1F5F9] hover:bg-[#334155] hover:text-white'}`}>
            <div className={`rounded-full p-2 ${isActive ? 'bg-[#6F3FF5]/20 shadow-sm' : ''}`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-semibold">{label}</span>
          </Link>
        );
      })}
    </div>
  );
};

// --- FAB ---
export const FAB = ({ href }: { href: string }) => (
  <Link href={href} className="fixed bottom-24 right-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-[0_10px_24px_rgba(109,93,246,0.24)] transition-all duration-200 active:scale-90">
    <Plus className="h-7 w-7" />
  </Link>
);
