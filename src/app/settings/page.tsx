"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Card, SectionHeader, Avatar } from '@/components/ui';
import PageLayout from '@/components/PageLayout';
import {
  Moon,
  Bell,
  Languages,
  Info,
  ShieldCheck,
  HelpCircle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useWallet } from '@/context/WalletContext';

type DialogState = {
  title: string;
  message: string;
} | null;

export default function SettingsPage() {
  const { walletAddress } = useWallet();
  const [notifications, setNotifications] = useState(true);
  const [dialog, setDialog] = useState<DialogState>(null);
  
  const [profile, setProfile] = useState({ name: 'My Profile', username: '@username', avatar: null as string | null });

  useEffect(() => {
    if(walletAddress) {
      setProfile({
        name: localStorage.getItem(`profile-${walletAddress}-name`) || 'My Profile',
        username: localStorage.getItem(`profile-${walletAddress}-username`) || '@username',
        avatar: localStorage.getItem(`profile-${walletAddress}-avatar`) || null,
      });
    }
  }, [walletAddress]);

  return (
    <PageLayout brandSide="left">
    <div className="bg-[var(--md-sys-color-background)] p-4 pb-24">
      <div className="py-6">
        <h1 className="text-3xl font-semibold text-[var(--md-sys-color-on-background)]">Settings</h1>
      </div>

      <Link href="/settings/profile" className="mb-8 block">
        <Card className="flex items-center gap-4 border-none bg-[#EDEBFF]">
          {profile.avatar ? (
            <img src={profile.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <Avatar initials={profile.name.substring(0,2).toUpperCase()} color="#6D5DF6" size="lg" />
          )}
          <div>
            <div className="font-semibold text-[#2F2A6B]">{profile.name}</div>
            <div className="text-sm text-[#6B7280]">{profile.username}</div>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-[#6D5DF6]" />
        </Card>
      </Link>

      <div className="space-y-4">
        <SectionHeader title="Preferences" />
        <SettingItem title="Dark Mode" description="Coming soon" />
        <SettingToggle title="Notifications" checked={notifications} onChange={() => setNotifications(!notifications)} />
        <SettingItem title="Language" description="English (US)" onClick={() => setDialog({ title: 'Language', message: 'Multi-language support coming soon.' })} />

        <SectionHeader title="About" />
        <SettingItem title="Version" description="1.0.0-alpha" onClick={() => setDialog({ title: 'Version', message: 'Settle Exchange\nVersion 1.0.0-alpha\nBuilt on Arc Mainnet' })} />
        <SettingItem title="Privacy Policy" onClick={() => setDialog({ title: 'Privacy Policy', message: 'Privacy Policy coming soon.' })} />
        <SettingItem title="Support" onClick={() => setDialog({ title: 'Support', message: 'Support Center coming soon.' })} />
      </div>

      {dialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-sm rounded-[28px] border border-[#E5E7EB] bg-white p-5 shadow-[0_20px_50px_rgba(17,24,39,0.18)]">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6B7280]">{dialog.title}</div>
            <div className="whitespace-pre-line text-sm leading-6 text-[#1C1C1E]">{dialog.message}</div>
            <button onClick={() => setDialog(null)} className="mt-5 rounded-2xl bg-[#6D5DF6] px-4 py-2.5 text-sm font-semibold text-white">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
    </PageLayout>
  );
}

function SettingItem({ title, description, onClick }: { title: string; description?: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-4 rounded-[24px] border border-[#E5E7EB] bg-white p-4 text-left transition-colors hover:bg-[#F9FAFB]">
      <div className="flex-1">
        <div className="font-medium text-[#1C1C1E]">{title}</div>
        {description && <div className="text-sm text-[#6B7280]">{description}</div>}
      </div>
      <ChevronRight className="h-5 w-5 text-[#6B7280]" />
    </button>
  );
}

function SettingToggle({ title, checked, onChange }: { title: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center gap-4 rounded-[24px] border border-[#E5E7EB] bg-white p-4">
      <div className="flex-1 font-medium text-[#1C1C1E]">{title}</div>
      <button onClick={onChange} className={`relative h-7 w-12 rounded-full transition-colors ${checked ? 'bg-[#6D5DF6]' : 'bg-[#E5E7EB]'}`}>
        <div className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}
