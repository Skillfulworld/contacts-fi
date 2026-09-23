import { NextRequest, NextResponse } from 'next/server';
import { parseUnits, type Hex } from 'viem';

// Arc Mainnet — Uniswap V3 SwapRouter02, verified 2026-09-14 from @uniswap/sdk-core ARC_ADDRESSES
const SWAP_ROUTER_02 = '0x53BF6B0684Ec7eF91e1387Da3D1a1769bC5A6F77' as Hex; // arc-studio-allow-onchain-literal

const TOKENS: Record<string, { address: Hex; decimals: number }> = {
  USDC:   { address: '0x3600000000000000000000000000000000000000', decimals: 6 }, // arc-studio-allow-onchain-literal
  EURC:   { address: '0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1', decimals: 6 }, // arc-studio-allow-onchain-literal
  cirBTC: { address: '0x171a4217b86a807a64eb94757db6849fb4bdbaa0', decimals: 8 }, // arc-studio-allow-onchain-literal
};

export async function POST(request: NextRequest) {
  let body: {
    fromToken?: string;
    toToken?: string;
    amount?: string;
    minAmountOut?: string;
    fee?: number;
    userAddress?: string;
    outDecimals?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { fromToken, toToken, amount, minAmountOut, fee, userAddress } = body;

  if (!fromToken || !toToken || !amount || !minAmountOut || !fee || !userAddress) {
    return NextResponse.json(
      { error: 'Missing required fields: fromToken, toToken, amount, minAmountOut, fee, userAddress.' },
      { status: 400 },
    );
  }

  const tokenIn = TOKENS[fromToken];
  const tokenOut = TOKENS[toToken];

  if (!tokenIn) return NextResponse.json({ error: `Unknown token: ${fromToken}` }, { status: 400 });
  if (!tokenOut) return NextResponse.json({ error: `Unknown token: ${toToken}` }, { status: 400 });

  const amountIn = parseUnits(amount, tokenIn.decimals);

  // Deadline: 20 minutes from now (timestamp-based — Arc blocks are ~0.5s so block-based deadlines are too short)
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

  // Return the unsigned swap envelope — the client will:
  // 1. Check allowance on tokenIn for SwapRouter02
  // 2. Send approve() if needed
  // 3. Call exactInputSingle() on SwapRouter02
  return NextResponse.json({
    routerAddress: SWAP_ROUTER_02,
    tokenInAddress: tokenIn.address,
    tokenOutAddress: tokenOut.address,
    inDecimals: tokenIn.decimals,
    outDecimals: tokenOut.decimals,
    amountIn: amountIn.toString(),
    amountOutMinimum: minAmountOut,
    fee,
    deadline: deadline.toString(),
    recipient: userAddress,
    sqrtPriceLimitX96: '0',
    chain: 'Arc',
  });
}
