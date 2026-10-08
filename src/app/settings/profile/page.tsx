"use client";

import Link from 'next/link';
import { ArrowLeft, Wallet, Copy, Check, Edit2, Save, Camera } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Avatar } from '@/components/ui';
import { useWallet } from '@/context/WalletContext';

const PROFILE_KEY = 'settlex_profile';

interface LocalProfile {
  username: string;
  avatar: string | null;
}

function loadProfile(wallet: string | null): LocalProfile {
  if (typeof window === 'undefined' || !wallet) return { username: '', avatar: null };
  try {
    const raw = localStorage.getItem(`${PROFILE_KEY}_${wallet.toLowerCase()}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { username: '', avatar: null };
}

function saveProfile(wallet: string, profile: LocalProfile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${PROFILE_KEY}_${wallet.toLowerCase()}`, JSON.stringify(profile));
}

export default function ProfilePage() {
  const { walletAddress, walletName } = useWallet();

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount / wallet change
  useEffect(() => {
    const p = loadProfile(walletAddress);
    setUsername(p.username);
    setAvatar(p.avatar);
  }, [walletAddress]);

  const handleSave = () => {
    if (walletAddress) {
      const clean = username.replace(/^@/, '').trim();
      saveProfile(walletAddress, { username: clean, avatar });
      setUsername(clean);
    }
    setIsEditing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Resize to max 256×256 before storing to keep localStorage lean
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new window.Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const scale = Math.max(size / img.width, size / img.height);
        const x = (size - img.width * scale) / 2;
        const y = (size - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        setAvatar(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result as string;
    };
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

  const displayName = username ? (username.startsWith('@') ? username : `@${username}`) : null;
  const initials = username
    ? username.replace(/^@/, '').slice(0, 2).toUpperCase()
    : walletAddress ? walletAddress.slice(2, 4).toUpperCase() : 'SX';

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-background)] p-4 pb-28">
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
            className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#1C1C1E] shadow-sm"
          >
            {isEditing
              ? <><Save className="h-4 w-4" /> Save</>
              : <><Edit2 className="h-4 w-4" /> Edit Profile</>
            }
          </button>
        </div>

        <div className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-[0_8px_24px_rgba(17,24,39,0.06)] space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div
              className="relative cursor-pointer"
              onClick={() => isEditing && fileInputRef.current?.click()}
            >
              {avatar
                ? <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover ring-4 ring-[#EFF6FF]" />
                : <Avatar initials={initials} color="#3B82F6" size="xl" />
              }
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white">
                  <Camera className="w-6 h-6" />
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>

            {isEditing ? (
              <div className="w-full">
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. alice"
                  className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-base font-semibold text-[#1C1C1E] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20"
                />
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xl font-bold text-[#1C1C1E]">
                  {displayName ?? 'Set a username'}
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
        </div>
      </div>
    </div>
  );
}
