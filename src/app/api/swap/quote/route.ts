import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseUnits, type Hex } from 'viem';
import { arc } from 'viem/chains';

// Arc Mainnet public RPC (Arc Studio does not provision an RPC proxy for Arc Mainnet in this project)
const ARC_RPC = 'https://rpc.mainnet.arc.io'; // arc-studio-allow-onchain-literal

// Uniswap V3 QuoterV2 — verified on Arc Mainnet 2026-09-14, sourced from @uniswap/sdk-core ARC_ADDRESSES
const QUOTER_V2 = '0x7DfD4F31be6814D2906BDE155c3e1B146EAc1468' as Hex; // arc-studio-allow-onchain-literal

// Token registry — Arc Mainnet contract addresses verified from Arc official docs and dexpaprika
const TOKENS: Record<string, { address: Hex; decimals: number }> = {
  USDC:   { address: '0x3600000000000000000000000000000000000000', decimals: 6 }, // arc-studio-allow-onchain-literal
  EURC:   { address: '0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1', decimals: 6 }, // arc-studio-allow-onchain-literal
  cirBTC: { address: '0x171a4217b86a807a64eb94757db6849fb4bdbaa0', decimals: 8 }, // arc-studio-allow-onchain-literal
};

// QuoterV2.quoteExactInputSingle — simulates and reverts by design; viem decodes the revert return
const QUOTER_ABI = [
  {
    name: 'quoteExactInputSingle',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn',           type: 'address' },
          { name: 'tokenOut',          type: 'address' },
          { name: 'amountIn',          type: 'uint256' },
          { name: 'fee',               type: 'uint24'  },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [
      { name: 'amountOut',               type: 'uint256' },
      { name: 'sqrtPriceX96After',       type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32'  },
      { name: 'gasEstimate',             type: 'uint256' },
    ],
  },
] as const;

// Fee tiers to probe in order of likelihood for stablecoin pairs: 100 (0.01%), 500 (0.05%), 3000 (0.3%)
const FEE_TIERS = [100, 500, 3000] as const;

export async function POST(request: NextRequest) {
  let body: { fromToken?: string; toToken?: string; amount?: string; userAddress?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { fromToken, toToken, amount, userAddress } = body;

  if (!fromToken || !toToken || !amount || !userAddress) {
    return NextResponse.json(
      { error: 'Missing required fields: fromToken, toToken, amount, userAddress.' },
      { status: 400 },
    );
  }

  const tokenIn = TOKENS[fromToken];
  const tokenOut = TOKENS[toToken];

  if (!tokenIn) return NextResponse.json({ error: `Unknown token: ${fromToken}` }, { status: 400 });
  if (!tokenOut) return NextResponse.json({ error: `Unknown token: ${toToken}` }, { status: 400 });
  if (tokenIn.address.toLowerCase() === tokenOut.address.toLowerCase()) {
    return NextResponse.json({ error: 'Select two different tokens.' }, { status: 400 });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ error: 'amount must be a positive number.' }, { status: 400 });
  }

  const amountIn = parseUnits(amount, tokenIn.decimals);
  const client = createPublicClient({ chain: arc, transport: http(ARC_RPC) }); // arc-studio-allow-onchain-literal

  // Try each fee tier; return the best (highest) quoted output
  let bestAmountOut = BigInt(0);
  let bestFee = 0;
  let lastError = '';

  for (const fee of FEE_TIERS) {
    try {
      const result = await client.simulateContract({
        address: QUOTER_V2,
        abi: QUOTER_ABI,
        functionName: 'quoteExactInputSingle',
        args: [{
          tokenIn: tokenIn.address,
          tokenOut: tokenOut.address,
          amountIn,
          fee,
          sqrtPriceLimitX96: BigInt(0),
        }],
      });
      const amountOut = result.result[0];
      if (amountOut > bestAmountOut) {
        bestAmountOut = amountOut;
        bestFee = fee;
      }
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lastError = (err as any)?.shortMessage ?? (err as Error)?.message ?? String(err);
      // No pool at this fee tier — continue to next
    }
  }

  if (bestAmountOut === BigInt(0)) {
    console.error(`[swap/quote] No route found for ${fromToken}→${toToken} on Arc Mainnet:`, lastError);
    return NextResponse.json(
      { error: `No liquidity route found for ${fromToken}→${toToken} on Arc Mainnet. The pool may not exist or have insufficient liquidity.` },
      { status: 404 },
    );
  }

  // 0.5% slippage floor → minimum received
  const slippageBps = 50;
  const minAmountOut = (bestAmountOut * BigInt(10000 - slippageBps)) / BigInt(10000);

  return NextResponse.json({
    fromToken,
    toToken,
    tokenInAddress: tokenIn.address,
    tokenOutAddress: tokenOut.address,
    inDecimals: tokenIn.decimals,
    outDecimals: tokenOut.decimals,
    amountIn: amountIn.toString(),
    amountOut: bestAmountOut.toString(),
    minAmountOut: minAmountOut.toString(),
    fee: bestFee,
    slippageBps,
    userAddress,
    chain: 'Arc',
  });
}
