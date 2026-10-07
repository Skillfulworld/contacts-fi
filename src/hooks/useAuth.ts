"use client";

/**
 * useAuth — SIWE (Sign-In With Ethereum) auth hook.
 * Manages session token in localStorage. Session expires after 7 days.
 * Automatically signs in when wallet connects; signs out on disconnect.
 */

import { useCallback, useEffect, useState } from 'react';
import { useWallet } from '@/context/WalletContext';

const SESSION_KEY = 'settlex_session_token';

export function useAuth() {
  const { walletAddress, walletProvider, isConnected } = useWallet();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Load persisted session on mount
  useEffect(() => {
    const stored = typeof window !== 'undefined'
      ? localStorage.getItem(SESSION_KEY)
      : null;
    if (stored) setSessionToken(stored);
  }, []);

  // Auto sign-in when wallet connects and no session yet
  useEffect(() => {
    if (isConnected && walletAddress && !sessionToken && !isSigningIn) {
      signIn().catch(console.error);
    }
    // Sign out when wallet disconnects
    if (!isConnected && sessionToken) {
      signOut();
    }
  }, [isConnected, walletAddress, sessionToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = useCallback(async () => {
    if (!walletAddress || !walletProvider) return;
    setIsSigningIn(true);
    setAuthError(null);

    try {
      // 1. Get nonce from server
      const nonceRes = await fetch(`/api/auth/nonce?address=${walletAddress.toLowerCase()}`);
      if (!nonceRes.ok) throw new Error('Failed to fetch nonce');
      const { nonce } = await nonceRes.json();

      // 2. Build SIWE message
      const now = new Date();
      const expirationTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const message = [
        'settlex.app wants you to sign in with your Ethereum account:',
        walletAddress,
        '',
        'Sign in to Settle Exchange',
        '',
        `URI: https://settlex.app`,
        'Version: 1',
        'Chain ID: 5042',
        `Nonce: ${nonce}`,
        `Issued At: ${now.toISOString()}`,
        `Expiration Time: ${expirationTime}`,
      ].join('\n');

      // 3. Request wallet signature
      const signature = await walletProvider.request({
        method: 'personal_sign',
        params: [message, walletAddress],
      }) as string;

      // 4. Verify with server → get session token
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature, address: walletAddress.toLowerCase() }),
      });
      if (!verifyRes.ok) throw new Error('Signature verification failed');
      const { sessionToken: token } = await verifyRes.json();

      localStorage.setItem(SESSION_KEY, token);
      setSessionToken(token);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed';
      setAuthError(msg);
      console.error('SIWE sign-in error', err);
    } finally {
      setIsSigningIn(false);
    }
  }, [walletAddress, walletProvider]);

  const signOut = useCallback(async () => {
    const token = sessionToken ?? localStorage.getItem(SESSION_KEY);
    if (token) {
      // Best-effort server revocation
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem(SESSION_KEY);
    setSessionToken(null);
  }, [sessionToken]);

  const authHeaders: Record<string, string> = sessionToken
    ? { Authorization: `Bearer ${sessionToken}` }
    : {};

  return {
    sessionToken,
    isSignedIn: Boolean(sessionToken),
    isSigningIn,
    authError,
    signIn,
    signOut,
    authHeaders,
  };
}
