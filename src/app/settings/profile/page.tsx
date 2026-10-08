"use client";

import Link from 'next/link';
import { ArrowLeft, Wallet, Network, Package, Copy, Check, Edit2, Save, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar } from '@/components/ui';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { walletAddress, walletName, chainId } = useWallet();
  const { authHeaders, isSignedIn, isSigningIn, signIn } = useAuth();

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [name, setName] = useState('User Name');
  const [username, setUsername] = useState('@username');
  const [bio, setBio] = useState('My bio');
  const [avatar, setAvatar] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile from Supabase when signed in
  const loadProfile = useCallback(async () => {
    if (!isSignedIn || !walletAddress) return;
    setIsLoadingProfile(true);
    try {
      const res = await fetch('/api/profile', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) setName(data.display_name);
        if (data.username) setUsername(data.username.startsWith('@') ? data.username : `@${data.username}`);
        if (data.bio) setBio(data.bio);
        if (data.avatar_url) setAvatar(data.avatar_url);
      }
    } catch (err) {
      console.error('Profile load error', err);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [isSignedIn, walletAddress, authHeaders]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    if (!isSignedIn) { await signIn(); return; }
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          display_name: name,
          username: username.replace(/^@/, ''),
          bio,
          avatar_url: avatar ?? undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Save failed');
      }
      setIsEditing(false);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // TODO: upload to Supabase Storage and store the URL
    // For now, use a local data URL as a preview (will not persist across devices)
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
    } catch (error) {
      console.error('Failed to copy address', error);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-background)] p-4 pb-24">
      <div className="py-4">
        <div className="flex justify-between items-center mb-6">
          <Link href="/settings" className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#1C1C1E] shadow-sm">
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

        {/* Auth notice */}
        {walletAddress && !isSignedIn && (
          <div className="mb-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-[#1D4ED8]">Sign in to sync your profile across devices.</p>
            <button
              onClick={signIn}
              disabled={isSigningIn}
              className="ml-3 shrink-0 rounded-full bg-[#3B82F6] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {isSigningIn ? 'Signing…' : 'Sign In'}
            </button>
          </div>
        )}

        {saveError && (
          <div className="mb-4 rounded-2xl bg-red-50 border border-red-100 px-4 py-3">
            <p className="text-sm text-red-600">{saveError}</p>
          </div>
        )}

        <div className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-[0_8px_24px_rgba(17,24,39,0.06)]">
          {isLoadingProfile ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#3B82F6]" />
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col items-center text-center gap-4">
                <div className="relative cursor-pointer" onClick={() => isEditing && fileInputRef.current?.click()}>
                  {avatar
                    ? <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                    : <Avatar initials={name.substring(0, 2).toUpperCase()} color="#3B82F6" size="lg" />
                  }
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white">
                      <Edit2 className="w-6 h-6" />
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>

                <div className="w-full">
                  <div className="text-xl font-bold text-[#1C1C1E] mb-1">My Profile</div>
                  {isEditing ? (
                    <div className="space-y-4 w-full text-left">
                      <div>
                        <label className="text-xs font-semibold text-[#6B7280]">Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full text-lg font-semibold border rounded-lg p-2 mt-1" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#6B7280]">Username</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full text-sm text-[#6B7280] border rounded-lg p-2 mt-1" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#6B7280]">Bio</label>
                        <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full text-sm text-[#6B7280] border rounded-lg p-2 mt-1" rows={3} />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-lg font-semibold text-[#1C1C1E]">{name}</div>
                      <div className="text-sm text-[#3B82F6]">{username}</div>
                      <div className="text-sm text-[#6B7280] mt-1">{bio}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[24px] border border-[#E5E7EB] bg-[#F5F6F8] p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#6B7280]">
                    <Wallet className="h-4 w-4" />
                    Connected Wallet
                  </div>
                  <div className="font-semibold text-[#1C1C1E]">{walletName || 'No wallet connected'}</div>
                  <div className="mt-2 flex items-center gap-2 break-all text-sm text-[#6B7280]">
                    <span>{walletAddress || 'Not available yet'}</span>
                    {walletAddress && (
                      <button onClick={handleCopy} className="rounded-full border border-[#E5E7EB] bg-white p-1.5 text-[#3B82F6]">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#E5E7EB] bg-[#F5F6F8] p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#6B7280]">
                    <Network className="h-4 w-4" />
                    Current Network
                  </div>
                  <div className="font-semibold text-[#1C1C1E]">{chainId ? `Chain ${chainId}` : 'Not available'}</div>
                </div>

                <div className="rounded-[24px] border border-[#E5E7EB] bg-[#F5F6F8] p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#6B7280]">
                    <Package className="h-4 w-4" />
                    App Version
                  </div>
                  <div className="font-semibold text-[#1C1C1E]">1.0.0</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
