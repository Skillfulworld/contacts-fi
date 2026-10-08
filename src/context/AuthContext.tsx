"use client";

/**
 * AuthContext — single SIWE session shared across the entire app.
 *
 * Rules:
 * - Session token stored in localStorage under SESSION_KEY.
 * - On mount: load token from localStorage immediately (synchronous read).
 * - When wallet connects and no valid session exists: trigger ONE sign-in.
 * - When wallet disconnects: clear session.
 * - All components consume useAuth() from here — never call signIn() themselves.
 * - Session is scoped to the wallet address: switching wallets clears the old session.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useWallet } from '@/context/WalletContext';

const SESSION_KEY = 'settlex_session_token';
const SESSION_WALLET_KEY = 'settlex_session_wallet';

interface AuthContextValue {
  sessionToken: string | null;
  isSignedIn: boolean;
  isSigningIn: boolean;
  authError: string | null;
  authHeaders: Record<string, string>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { walletAddress, walletProvider, isConnected } = useWallet();

  // Initialise synchronously from localStorage so the token is never null on first render
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(SESSION_KEY);
  });
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Guard: prevent concurrent sign-in calls
  const signingRef = useRef(false);

  const signOut = useCallback(async () => {
    const token = sessionToken ?? localStorage.getItem(SESSION_KEY);
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_WALLET_KEY);
    setSessionToken(null);
    setAuthError(null);
  }, [sessionToken]);

  const signIn = useCallback(async () => {
    if (!walletAddress || !walletProvider) return;
    if (signingRef.current) return; // already in progress
    signingRef.current = true;
    setIsSigningIn(true);
    setAuthError(null);

    try {
      const nonceRes = await fetch(`/api/auth/nonce?address=${walletAddress.toLowerCase()}`);
      if (!nonceRes.ok) throw new Error('Failed to fetch nonce');
      const { nonce } = await nonceRes.json();

      const now = new Date();
      const expirationTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const message = [
        'settlex.app wants you to sign in with your Ethereum account:',
        walletAddress,
        '',
        'Sign in to Settle Exchange',
        '',
        'URI: https://settlex.app',
        'Version: 1',
        'Chain ID: 5042',
        `Nonce: ${nonce}`,
        `Issued At: ${now.toISOString()}`,
        `Expiration Time: ${expirationTime}`,
      ].join('\n');

      const signature = await walletProvider.request({
        method: 'personal_sign',
        params: [message, walletAddress],
      }) as string;

      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature, address: walletAddress.toLowerCase() }),
      });
      if (!verifyRes.ok) throw new Error('Signature verification failed');
      const { sessionToken: token } = await verifyRes.json();

      localStorage.setItem(SESSION_KEY, token);
      localStorage.setItem(SESSION_WALLET_KEY, walletAddress.toLowerCase());
      setSessionToken(token);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed';
      // User rejected — don't show an error, just don't sign in
      if (!msg.includes('rejected') && !msg.includes('denied') && !msg.includes('cancelled') && !msg.includes('User denied')) {
        setAuthError(msg);
      }
      console.error('SIWE sign-in error', err);
    } finally {
      setIsSigningIn(false);
      signingRef.current = false;
    }
  }, [walletAddress, walletProvider]);

  // When wallet connects: check if existing session belongs to this wallet.
  // If yes: reuse it. If no: sign in once.
  // When wallet disconnects: clear session.
  useEffect(() => {
    if (isConnected && walletAddress) {
      const storedWallet = localStorage.getItem(SESSION_WALLET_KEY);
      const storedToken = localStorage.getItem(SESSION_KEY);

      if (storedToken && storedWallet === walletAddress.toLowerCase()) {
        // Valid session for this wallet — restore it without signing
        setSessionToken(storedToken);
        return;
      }

      // Different wallet or no session — clear old session and sign in
      if (storedToken && storedWallet !== walletAddress.toLowerCase()) {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_WALLET_KEY);
        setSessionToken(null);
      }

      // Auto sign-in (only if not already signing)
      if (!signingRef.current) {
        signIn().catch(console.error);
      }
    } else if (!isConnected) {
      // Wallet disconnected — clear session
      const storedToken = localStorage.getItem(SESSION_KEY);
      if (storedToken) {
        signOut().catch(console.error);
      }
    }
  }, [isConnected, walletAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  const authHeaders: Record<string, string> = sessionToken
    ? { Authorization: `Bearer ${sessionToken}` }
    : {};

  const value: AuthContextValue = {
    sessionToken,
    isSignedIn: Boolean(sessionToken),
    isSigningIn,
    authError,
    authHeaders,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
