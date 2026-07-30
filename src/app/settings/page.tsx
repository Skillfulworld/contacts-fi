"use client";
import { useState, useEffect } from 'react';
import { Card, SectionHeader, Avatar } from '@/components/ui';
import { 
  User, 
  Moon, 
  Bell, 
  Languages, 
  Info, 
  ShieldCheck, 
  HelpCircle, 
  ChevronRight 
} from 'lucide-react';

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('darkMode', String(newValue));
  };

  return (
    <div className="p-4 pb-24 bg-[var(--md-sys-color-background)] min-h-screen">
      <div className="py-6">
        <h1 className="text-3xl font-semibold text-[var(--md-sys-color-on-background)]">Settings</h1>
      </div>

      <Card className="flex items-center gap-4 mb-8 !bg-[var(--md-sys-color-primary-container)] !border-none active:scale-[0.98] transition-transform cursor-pointer">
        <Avatar initials="ME" color="bg-[var(--md-sys-color-primary)]" size="lg" />
        <div>
          <div className="font-bold text-[var(--md-sys-color-on-primary-container)]">My Profile</div>
          <div className="text-sm text-[var(--md-sys-color-on-primary-container)] opacity-70">Manage your identity</div>
        </div>
        <ChevronRight className="ml-auto w-6 h-6 text-[var(--md-sys-color-on-primary-container)]" />
      </Card>

      <div className="space-y-6">
        <SectionHeader title="Preferences" />
        <SettingToggle 
          icon={<Moon className="w-6 h-6" />} 
          title="Dark Mode" 
          checked={darkMode} 
          onChange={toggleDarkMode} 
        />
        <SettingToggle 
          icon={<Bell className="w-6 h-6" />} 
          title="Notifications" 
          checked={notifications} 
          onChange={() => setNotifications(!notifications)} 
        />
        <SettingItem 
          icon={<Languages className="w-6 h-6" />} 
          title="Language" 
          description="English (US)" 
        />

        <SectionHeader title="About" />
        <SettingItem icon={<Info className="w-6 h-6" />} title="Version 1.0.0" />
        <SettingItem icon={<ShieldCheck className="w-6 h-6" />} title="Privacy Policy" />
        <SettingItem icon={<HelpCircle className="w-6 h-6" />} title="Support" />
      </div>
    </div>
  );
}

function SettingItem({ icon, title, description }: { icon: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-[var(--md-sys-color-surface-variant)]/50 rounded-2xl transition-colors cursor-pointer">
      <div className="text-[var(--md-sys-color-on-surface-variant)]">{icon}</div>
      <div className="flex-1">
        <div className="font-medium text-[var(--md-sys-color-on-surface)]">{title}</div>
        {description && <div className="text-xs text-[var(--md-sys-color-outline)]">{description}</div>}
      </div>
      <ChevronRight className="w-5 h-5 text-[var(--md-sys-color-outline)]" />
    </div>
  );
}

function SettingToggle({ icon, title, checked, onChange }: { icon: React.ReactNode; title: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl">
      <div className="text-[var(--md-sys-color-on-surface-variant)]">{icon}</div>
      <div className="flex-1 font-medium text-[var(--md-sys-color-on-surface)]">{title}</div>
      <button 
        onClick={onChange}
        className={`w-12 h-7 rounded-full relative transition-colors ${checked ? 'bg-[var(--md-sys-color-primary)]' : 'bg-[var(--md-sys-color-outline-variant)]'}`}
      >
        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}
