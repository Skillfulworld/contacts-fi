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
  walletProvider: BrowserWallet | null;
  isConnecting: boolean;
  isConnected: boolean;
  availableWallets: BrowserWallet[];
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshChain: () => Promise<string | null>;
  switchToArcMainnet: () => Promise<{ ok: boolean; chainId?: string | null; error?: string | null }>;
  /** @deprecated alias for switchToArcMainnet */
  switchToArcTestnet: () => Promise<{ ok: boolean; chainId?: string | null; error?: string | null }>;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

// Arc Mainnet — chain ID 5042 (0x13B2)
export const ARC_MAINNET_NETWORK = {
  chainId: '0x13B2',
  chainName: 'Arc',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.mainnet.arc.io'],
  blockExplorerUrls: ['https://explorer.arc.io'],
};

// Kept for backward-compat references; points at mainnet for production
export const ARC_TESTNET_NETWORK = ARC_MAINNET_NETWORK;

export const isArcMainnetChainId = (value?: string | null) => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '0x13b2' || normalized === '5042';
};

/** @deprecated use isArcMainnetChainId */
export const isArcTestnetChainId = isArcMainnetChainId;

const CHAIN_NAMES: Record<string, string> = {
  '0x1':     'Ethereum',
  '1':       'Ethereum',
  '0x89':    'Polygon',
  '137':     'Polygon',
  '0xa':     'Optimism',
  '10':      'Optimism',
  '0xa4b1':  'Arbitrum One',
  '42161':   'Arbitrum One',
  '0x2105':  'Base',
  '8453':    'Base',
  '0xa86a':  'Avalanche',
  '43114':   'Avalanche',
  '0xaa36a7':'Sepolia',
  '11155111':'Sepolia',
  '0x13b2':  'Arc Mainnet',
  '5042':    'Arc Mainnet',
};

export const getChainDisplayName = (value?: string | null) => {
  if (!value) return 'Unknown Chain';
  const normalized = value.trim().toLowerCase();
  return CHAIN_NAMES[normalized] ?? CHAIN_NAMES[value.trim()] ?? `Chain ${value}`;
};

let appKitInstance: AppKit | null = null;

export const getAppKitInstance = () => {
  if (!appKitInstance) {
    appKitInstance = new AppKit();
  }
  return appKitInstance;
};

const toWalletName = (provider: BrowserWallet | null | undefined) => {
  const providerInfo = provider?.info as WalletProviderInfo | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = provider as any;
  const name = providerInfo?.name || p?.name || p?.walletName;
  if (typeof name === 'string' && name.trim()) {
    return name;
  }
  const providerKey = p?.isMetaMask ? 'MetaMask' : 'Browser Wallet';
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

const SESSION_KEY = 'settlex_wallet_session';

function saveSession(address: string, chainId: string | null) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ address, chainId })); } catch { /* ignore */ }
}
function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}
function loadSession(): { address: string; chainId: string | null } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [adapter, setAdapter] = useState<unknown | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [walletProvider, setWalletProvider] = useState<BrowserWallet | null>(null);
  const [availableWallets, setAvailableWallets] = useState<BrowserWallet[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  // Restore session from sessionStorage on mount (survives client-side navigation)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const session = loadSession();
    if (!session) return;
    // Re-attach the provider silently (no prompt)
    const globalWindow = window as Window & typeof globalThis & { ethereum?: BrowserWallet | { providers?: BrowserWallet[] } };
    const injected = globalWindow.ethereum as BrowserWallet | undefined;
    if (!injected?.request) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const candidates = Array.isArray((injected as any).providers)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ((injected as any).providers as BrowserWallet[])
      : [injected];
    const provider = candidates[0];
    if (!provider?.request) return;
    // Check MetaMask still has access (no prompt, just check cached accounts)
    provider.request({ method: 'eth_accounts' }).then((accounts) => {
      const list = accounts as string[];
      const matched = list.find(a => a.toLowerCase() === session.address.toLowerCase());
      if (!matched) { clearSession(); return; }
      createViemAdapterFromProvider({ provider: provider as Parameters<typeof createViemAdapterFromProvider>[0]['provider'] })
        .then(createdAdapter => {
          setAdapter(createdAdapter);
          setWalletAddress(matched);
          setWalletName(toWalletName(provider));
          setWalletProvider(provider);
          setChainId(session.chainId);
        }).catch(() => clearSession());
    }).catch(() => clearSession());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (Array.isArray((injected as any).providers)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const providerCandidates = Array.isArray((injected as any)?.providers)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? ((injected as any).providers as BrowserWallet[])
        : injected
          ? [injected]
          : availableWallets;

      const provider = providerCandidates[0];
      if (!provider?.request) {
        throw new Error('No compatible wallet provider was detected.');
      }

      // Force account picker every time — even if MetaMask has a cached connection.
      // wallet_requestPermissions with eth_accounts always shows the account selector.
      let account: string | undefined;
      try {
        const perms = await provider.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        }) as Array<{ caveats?: Array<{ value?: string[] }> }>;
        account = perms?.[0]?.caveats?.[0]?.value?.[0];
      } catch {
        // User cancelled the picker or wallet doesn't support wallet_requestPermissions
      }
      // Fallback: eth_requestAccounts gives us the selected account
      if (!account) {
        const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
        account = accounts[0];
      }
      if (!account) {
        throw new Error('Wallet access was not granted.');
      }

      const appKit = getAppKitInstance();
      void appKit;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const createdAdapter = await createViemAdapterFromProvider({ provider: provider as any });
      const networkId = await provider.request({ method: 'eth_chainId' }) as string | number | undefined;
      const resolvedChainId = networkId ? String(networkId) : null;
      setAdapter(createdAdapter);
      setWalletAddress(account);
      setWalletName(toWalletName(provider));
      setWalletProvider(provider);
      setChainId(resolvedChainId);
      saveSession(account, resolvedChainId);
    } catch (error) {
      console.error('Wallet connection failed', error);
      setAdapter(null);
      setWalletAddress(null);
      setWalletName(null);
    } finally {
      setIsConnecting(false);
    }
  };

  // Listen for chain + account changes from MetaMask
  useEffect(() => {
    if (!walletProvider) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const provider = walletProvider as any;
    const handleChainChanged = (newChainId: string) => {
      const id = String(newChainId);
      setChainId(id);
      // Update session with new chain
      setWalletAddress(prev => { if (prev) saveSession(prev, id); return prev; });
    };
    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        // MetaMask disconnected
        clearSession();
        setAdapter(null);
        setWalletAddress(null);
        setWalletName(null);
        setChainId(null);
        setWalletProvider(null);
      } else {
        // Account switched — update silently
        const newAccount = accounts[0];
        setWalletAddress(newAccount);
        setChainId(prev => { saveSession(newAccount, prev); return prev; });
      }
    };
    if (typeof provider.on === 'function') {
      provider.on('chainChanged', handleChainChanged);
      provider.on('accountsChanged', handleAccountsChanged);
    }
    return () => {
      if (typeof provider.removeListener === 'function') {
        provider.removeListener('chainChanged', handleChainChanged);
        provider.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [walletProvider]);

  const disconnectWallet = () => {
    clearSession();
    setAdapter(null);
    setWalletAddress(null);
    setWalletName(null);
    setChainId(null);
    setWalletProvider(null);
  };

  const refreshChain = async () => {
    if (!walletProvider?.request) {
      return null;
    }

    try {
      const networkId = await walletProvider.request({ method: 'eth_chainId' }) as string | number | undefined;
      const nextChainId = networkId ? String(networkId) : null;
      setChainId(nextChainId);
      return nextChainId;
    } catch (error) {
      console.error('Failed to refresh chain', error);
      return null;
    }
  };

  const switchToArcMainnet = async () => {
    if (!walletProvider?.request) {
      return { ok: false, error: 'Wallet provider is not available.' };
    }

    try {
      const currentChainId = await refreshChain();
      if (isArcMainnetChainId(currentChainId)) {
        return { ok: true, chainId: currentChainId, error: null };
      }

      try {
        await walletProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ARC_MAINNET_NETWORK.chainId }],
        });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await walletProvider.request({
            method: 'wallet_addEthereumChain',
            params: [ARC_MAINNET_NETWORK],
          });
          await walletProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: ARC_MAINNET_NETWORK.chainId }],
          });
        } else {
          throw switchError;
        }
      }

      const refreshedChain = await refreshChain();
      if (isArcMainnetChainId(refreshedChain)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nextAdapter = await createViemAdapterFromProvider({ provider: walletProvider as any });
        setAdapter(nextAdapter);
        return { ok: true, chainId: refreshedChain, error: null };
      }
      return { ok: false, chainId: refreshedChain, error: 'Failed to switch to Arc Mainnet.' };
    } catch (error: any) {
      console.error('Switch network error', error);
      return { ok: false, error: error?.message || 'The wallet rejected the request.' };
    }
  };

  // Backward-compat alias
  const switchToArcTestnet = switchToArcMainnet;

  const value = useMemo<WalletContextValue>(() => ({
    adapter,
    walletAddress,
    walletName,
    chainId,
    walletProvider,
    isConnecting,
    isConnected: Boolean(walletAddress && adapter),
    availableWallets,
    connectWallet,
    disconnectWallet,
    refreshChain,
    switchToArcMainnet,
    switchToArcTestnet,
  }), [adapter, availableWallets, chainId, isConnecting, walletAddress, walletName, walletProvider]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used inside a WalletProvider');
  }
  return context;
};
