"use client";

/**
 * /r/[address] — Referral landing page.
 * Stores the referrer's wallet address in localStorage and redirects to the app.
 */
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function ReferralPage() {
  const router = useRouter();
  const params = useParams();
  const address = params.address as string;

  useEffect(() => {
    if (address && /^0x[a-fA-F0-9]{40}$/.test(address)) {
      try {
        localStorage.setItem('settlex_referrer', address.toLowerCase());
      } catch { /* ignore */ }
    }
    router.replace('/');
  }, [address, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F6F8]">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#6D5DF6] border-t-transparent" />
        <p className="text-sm text-[#6B7280]">Joining Settle Exchange…</p>
      </div>
    </div>
  );
}
