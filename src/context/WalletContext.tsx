"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppKit } from '@circle-fin/app-kit';
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2';

type WalletProviderInfo = {
  uuid?: string;
  name?: string;
  icon?: string;
  rdns?: string;
};

type BrowserWallet = {
  info?: WalletProviderInfo;
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
  [key: string]: unknown;
};

type WalletContextValue = {
  adapter: unknown | null;
  walletAddress: string | null;
  walletName: string | null;
  chainId: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  availableWallets: BrowserWallet[];
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

let appKitInstance: AppKit | null = null;

export const getAppKitInstance = () => {
  if (!appKitInstance) {
    appKitInstance = new AppKit();
  }
  return appKitInstance;
};

const toWalletName = (provider: BrowserWallet | null | undefined) => {
  const providerInfo = provider?.info as WalletProviderInfo | undefined;
  const name = providerInfo?.name || (provider as any)?.name || (provider as any)?.walletName;
  if (typeof name === 'string' && name.trim()) {
    return name;
  }
  const providerKey = (provider as any)?.isMetaMask ? 'MetaMask' : 'Browser Wallet';
  return providerKey;
};

const normalizeWallets = (wallets: BrowserWallet[]) => {
  const unique = new Map<string, BrowserWallet>();
  wallets.forEach((wallet) => {
    const key = (wallet.info?.rdns || wallet.info?.uuid || wallet.info?.name || 'wallet').toString();
    if (!unique.has(key)) {
      unique.set(key, wallet);
    }
  });
  return Array.from(unique.values());
};

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [adapter, setAdapter] = useState<unknown | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<BrowserWallet[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const discovered: BrowserWallet[] = [];
    const addProvider = (provider: BrowserWallet | null | undefined) => {
      if (!provider?.request) return;
      const alreadyFound = discovered.some((existing) => existing.info?.rdns === provider.info?.rdns && existing.info?.uuid === provider.info?.uuid);
      if (!alreadyFound) {
        discovered.push(provider);
      }
    };

    const collectProviders = () => {
      const globalWindow = window as Window & typeof globalThis & { ethereum?: BrowserWallet | { providers?: BrowserWallet[] } };
      const injected = globalWindow.ethereum as BrowserWallet | undefined;
      if (injected) {
        if (Array.isArray((injected as any).providers)) {
          (injected as any).providers.forEach((provider: BrowserWallet) => addProvider(provider));
        } else {
          addProvider(injected);
        }
      }

      const providers = normalizeWallets(discovered);
      setAvailableWallets(providers);
    };

    const handleAnnounce = (event: Event) => {
      const detail = (event as Event & { detail?: { provider?: BrowserWallet } }).detail;
      addProvider(detail?.provider);
      setAvailableWallets(normalizeWallets(discovered));
    };

    collectProviders();
    window.addEventListener('eip6963:announceProvider', handleAnnounce as EventListener);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    return () => {
      window.removeEventListener('eip6963:announceProvider', handleAnnounce as EventListener);
    };
  }, []);

  const connectWallet = async () => {
    if (typeof window === 'undefined') return;

    setIsConnecting(true);

    try {
      const globalWindow = window as Window & typeof globalThis & { ethereum?: BrowserWallet | { providers?: BrowserWallet[] } };
      const injected = globalWindow.ethereum as BrowserWallet | undefined;
      const providerCandidates = Array.isArray((injected as any)?.providers)
        ? ((injected as any).providers as BrowserWallet[])
        : injected
          ? [injected]
          : availableWallets;

      const provider = providerCandidates[0];
      if (!provider?.request) {
        throw new Error('No compatible wallet provider was detected.');
      }

      const [account] = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
      if (!account) {
        throw new Error('Wallet access was not granted.');
      }

      const appKit = getAppKitInstance();
      void appKit;

      const createdAdapter = await createViemAdapterFromProvider({ provider: provider as any });
      const networkId = await provider.request({ method: 'eth_chainId' }) as string | number | undefined;
      setAdapter(createdAdapter);
      setWalletAddress(account);
      setWalletName(toWalletName(provider));
      setChainId(networkId ? String(networkId) : null);
    } catch (error) {
      console.error('Wallet connection failed', error);
      setAdapter(null);
      setWalletAddress(null);
      setWalletName(null);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAdapter(null);
    setWalletAddress(null);
    setWalletName(null);
    setChainId(null);
  };

  const value = useMemo<WalletContextValue>(() => ({
    adapter,
    walletAddress,
    walletName,
    chainId,
    isConnecting,
    isConnected: Boolean(walletAddress && adapter),
    availableWallets,
    connectWallet,
    disconnectWallet,
  }), [adapter, availableWallets, chainId, isConnecting, walletAddress, walletName]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used inside a WalletProvider');
  }
  return context;
};
