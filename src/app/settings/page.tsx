"use client";
import { Card, SectionHeader, Avatar } from '@/components/ui';

export default function SettingsPage() {
  return (
    <div className="p-4">
      <div className="py-6">
        <h1 className="text-2xl font-normal text-[var(--md-sys-color-on-background)]">Settings</h1>
      </div>

      <Card className="flex items-center gap-4 mb-8 !bg-[var(--md-sys-color-primary-container)]">
        <Avatar initials="ME" color="bg-[var(--md-sys-color-primary)]" size="lg" />
        <div>
          <div className="font-bold text-[var(--md-sys-color-on-primary-container)]">My Profile</div>
          <div className="text-sm text-[var(--md-sys-color-on-primary-container)] opacity-70">Manage your wallets and identity</div>
        </div>
        <div className="ml-auto text-xl">➡️</div>
      </Card>

      <div className="space-y-2">
        <SectionHeader title="Preferences" />
        <SettingItem icon="🌓" title="Dark Mode" description="System Default" />
        <SettingItem icon="🔔" title="Notifications" description="Enabled" />
        <SettingItem icon="🌍" title="Language" description="English (US)" />

        <SectionHeader title="About" />
        <SettingItem icon="ℹ️" title="Version" description="1.0.0-alpha.1" />
        <SettingItem icon="📄" title="Privacy Policy" />
        <SettingItem icon="🛠️" title="Support" />
      </div>

      <div className="mt-12 text-center opacity-40">
        <div className="text-xl font-bold italic">Contacts-Fi</div>
        <p className="text-[10px] uppercase tracking-widest mt-1">Arc Network Ecosystem</p>
      </div>
    </div>
  );
}

function SettingItem({ icon, title, description }: { icon: string; title: string; description?: string }) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-[var(--md-sys-color-surface-variant)] rounded-2xl transition-colors cursor-pointer">
      <span className="text-xl">{icon}</span>
      <div>
        <div className="font-medium">{title}</div>
        {description && <div className="text-xs text-[var(--md-sys-color-outline)]">{description}</div>}
      </div>
      <div className="ml-auto text-[var(--md-sys-color-outline)] opacity-30">➡️</div>
    </div>
  );
}
