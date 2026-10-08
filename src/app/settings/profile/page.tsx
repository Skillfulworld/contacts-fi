"use client";

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wallet, Copy, Check, Edit2, Save, Loader2, Camera } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar } from '@/components/ui';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const router = useRouter();
  const { walletAddress, walletName } = useWallet();
  const { authHeaders, sessionToken } = useAuth();

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Single username field + avatar only
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile from Supabase once we have a session
  const loadProfile = useCallback(async () => {
    if (!sessionToken) return;
    setIsLoadingProfile(true);
    try {
      const res = await fetch('/api/profile', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        if (data.username) setUsername(data.username);
        if (data.avatar_url) setAvatar(data.avatar_url);
      }
    } catch (err) {
      console.error('Profile load error', err);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [sessionToken]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSave = async () => {
    // No sign prompt — if no session just save what we can locally and skip API
    setIsSaving(true);
    setSaveError(null);
    try {
      if (sessionToken) {
        const res = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({
            username: username.replace(/^@/, ''),
            avatar_url: avatar ?? undefined,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? 'Save failed');
        }
      }
      setIsEditing(false);
      router.push('/settings');
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCopy = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  const initials = username
    ? username.replace(/^@/, '').slice(0, 2).toUpperCase()
    : walletAddress
      ? walletAddress.slice(2, 4).toUpperCase()
      : 'SX';

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-background)] p-4 pb-24">
      <div className="py-4 max-w-md mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#1C1C1E] shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#1C1C1E] shadow-sm disabled:opacity-60"
          >
            {isSaving
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
              : isEditing
              ? <><Save className="h-4 w-4" /> Save</>
              : <><Edit2 className="h-4 w-4" /> Edit Profile</>
            }
          </button>
        </div>

        {saveError && (
          <div className="mb-4 rounded-2xl bg-red-50 border border-red-100 px-4 py-3">
            <p className="text-sm text-red-600">{saveError}</p>
          </div>
        )}

        <div className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-[0_8px_24px_rgba(17,24,39,0.06)] space-y-6">
          {isLoadingProfile ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#3B82F6]" />
            </div>
          ) : (
            <>
              {/* Avatar */}
              <div className="flex flex-col items-center gap-4">
                <div
                  className="relative cursor-pointer"
                  onClick={() => isEditing && fileInputRef.current?.click()}
                >
                  {avatar
                    ? <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover ring-4 ring-[#EFF6FF]" />
                    : <Avatar initials={initials} color="#3B82F6" size="lg" />
                  }
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white">
                      <Camera className="w-6 h-6" />
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>

                {/* Username — display or edit */}
                {isEditing ? (
                  <div className="w-full">
                    <label className="block text-xs font-semibold text-[#6B7280] mb-1">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="e.g. alice or @alice"
                      className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-base font-semibold text-[#1C1C1E] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20"
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-xl font-bold text-[#1C1C1E]">
                      {username ? (username.startsWith('@') ? username : `@${username}`) : 'Set a username'}
                    </p>
                  </div>
                )}
              </div>

              {/* Wallet info */}
              <div className="rounded-[20px] border border-[#E5E7EB] bg-[#F5F6F8] p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#6B7280]">
                  <Wallet className="h-4 w-4" />
                  Connected Wallet
                </div>
                <p className="font-semibold text-[#1C1C1E]">{walletName || 'MetaMask'}</p>
                <div className="flex items-center gap-2">
                  <span className="break-all text-sm text-[#6B7280] flex-1">
                    {walletAddress || 'Not connected'}
                  </span>
                  {walletAddress && (
                    <button
                      onClick={handleCopy}
                      className="shrink-0 rounded-full border border-[#E5E7EB] bg-white p-1.5 text-[#3B82F6]"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
