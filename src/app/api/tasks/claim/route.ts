/**
 * POST /api/tasks/claim
 *
 * Verifies a wallet performed a task on Arc Mainnet and returns a signed
 * voucher the user submits to SettleXPoints.claimTask().
 *
 * Body:    { taskId: 'TASK_SWAP' | 'TASK_SEND', walletAddress: string, nonce: string }
 * Returns: { voucher: { taskId, day, nonce, sig } }
 */
import { NextRequest, NextResponse } from 'next/server';

const ARC_RPC = 'https://rpc.mainnet.arc.io'; // arc-studio-allow-onchain-literal
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000'; // arc-studio-allow-onchain-literal
const SWAP_ROUTER  = '0x53BF6B06b6E764b8f48D3CabBE8d07ee16dF5D6E'; // arc-studio-allow-onchain-literal — Uniswap V3 SwapRouter02 on Arc Mainnet

// Transfer(address indexed from, address indexed to, uint256 value)
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'; // arc-studio-allow-onchain-literal
// Swap(address indexed sender, address indexed recipient, ...) — Uniswap V3
const SWAP_TOPIC = '0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67'; // arc-studio-allow-onchain-literal

function padAddress(addr: string): string {
  return '0x' + addr.replace('0x', '').toLowerCase().padStart(64, '0');
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(ARC_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json() as { result?: T; error?: { message: string } };
  if (json.error) throw new Error(json.error.message);
  return json.result as T;
}

async function checkSwapped(wallet: string): Promise<boolean> {
  const latest = BigInt(await rpc<string>('eth_blockNumber', []));
  const from = '0x' + (latest - BigInt(5000)).toString(16);
  const to   = '0x' + latest.toString(16);
  const logs = await rpc<unknown[]>('eth_getLogs', [{
    address: SWAP_ROUTER,
    topics: [SWAP_TOPIC, padAddress(wallet)],
    fromBlock: from, toBlock: to,
  }]);
  return Array.isArray(logs) && logs.length > 0;
}

async function checkSent(wallet: string): Promise<boolean> {
  const latest = BigInt(await rpc<string>('eth_blockNumber', []));
  const from = '0x' + (latest - BigInt(5000)).toString(16);
  const to   = '0x' + latest.toString(16);
  const logs = await rpc<unknown[]>('eth_getLogs', [{
    address: USDC_ADDRESS,
    topics: [TRANSFER_TOPIC, padAddress(wallet)],
    fromBlock: from, toBlock: to,
  }]);
  return Array.isArray(logs) && logs.length > 0;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { taskId?: string; walletAddress?: string; nonce?: string };
    const { taskId, walletAddress, nonce: nonceStr } = body;

    if (!taskId || !walletAddress || nonceStr === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }
    if (!['TASK_SWAP', 'TASK_SEND'].includes(taskId)) {
      return NextResponse.json({ error: 'Unknown task' }, { status: 400 });
    }

    const signerKey = process.env.SETTLEX_SIGNER_PRIVATE_KEY;
    if (!signerKey) {
      return NextResponse.json({ error: 'Signer not configured' }, { status: 500 });
    }

    // Verify on-chain activity
    const verified = taskId === 'TASK_SWAP'
      ? await checkSwapped(walletAddress)
      : await checkSent(walletAddress);

    if (!verified) {
      return NextResponse.json({
        error: taskId === 'TASK_SWAP'
          ? 'No swap found for this wallet in the last few hours. Please make a swap first.'
          : 'No USDC send found for this wallet in the last few hours. Please send USDC first.',
      }, { status: 403 });
    }

    // Compute task ID hash matching contract keccak256("TASK_SWAP") / keccak256("TASK_SEND")
    const { keccak256, toBytes, encodePacked } = await import('viem');
    const { privateKeyToAccount } = await import('viem/accounts');

    const taskIdHash = keccak256(toBytes(taskId)) as `0x${string}`;
    const day = BigInt(Math.floor(Date.now() / 1000 / 86400));
    const nonce = BigInt(nonceStr);

    // Sign: keccak256(abi.encodePacked(user, taskId, day, nonce))
    const messageHash = keccak256(encodePacked(
      ['address', 'bytes32', 'uint256', 'uint256'],
      [walletAddress as `0x${string}`, taskIdHash, day, nonce],
    ));

    const account = privateKeyToAccount(signerKey as `0x${string}`);
    const sig = await account.signMessage({ message: { raw: messageHash as `0x${string}` } });

    return NextResponse.json({
      voucher: { taskId: taskIdHash, day: day.toString(), nonce: nonce.toString(), sig },
    });
  } catch (err) {
    console.error('[tasks/claim]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
