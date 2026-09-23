// Server-only: resolve token aliases → EVM addresses using the public chain definition.
// Do NOT import this file in any 'use client' component — swap-kit has Node-only dependencies.
import { getChainByEnum, Blockchain } from '@circle-fin/swap-kit';

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

/** Resolve a token alias (USDC, EURC, USDT) or pass-through EVM address to a checksummed address. */
export function resolveToken(chain: string, token: string): string {
  if (EVM_ADDRESS.test(token)) return token; // already a concrete address
  const def = getChainByEnum(chain as Blockchain); // throws on unknown chain
  const fromDef: Record<string, string | null | undefined> = {
    USDC: def.usdcAddress,
    EURC: def.eurcAddress,
    USDT: def.usdtAddress,
  };
  const addr = fromDef[token];
  if (!addr) throw new Error(`Token "${token}" is not available on ${chain}`);
  return addr;
}

/** Validate that a chain is supported by the swap SDK (does not call the service). */
export function isSupportedChain(chain: string): boolean {
  try {
    getChainByEnum(chain as Blockchain);
    return true;
  } catch {
    return false;
  }
}

/** Get the Adapter Contract address for a chain. Returns undefined if not swap-enabled. */
export function getAdapterAddress(chain: string): string | undefined {
  return getChainByEnum(chain as Blockchain).kitContracts?.adapter;
}

/** Return token decimals for a chain+token (falls back to 6 for known stablecoins). */
export function getTokenDecimals(chain: string, token: string): number {
  try {
    const def = getChainByEnum(chain as Blockchain);
    if (token === 'NATIVE') return def.nativeCurrency?.decimals ?? 18;
  } catch {
    // ignore
  }
  // USDC / EURC / USDT are always 6 decimals across all supported EVM chains
  return 6;
}
