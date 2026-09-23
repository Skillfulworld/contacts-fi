// Client-side helper: maps the /api/swap/execute envelope to viem writeContract args.
// All numeric string fields from the service may be hex OR decimal — BigInt() handles both.

const NATIVE_SENTINEL = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export type SwapEnvelope = {
  chain: string;
  amount: string; // base units (stringified integer or hex)
  tokenInAddress: `0x${string}`;
  adapterAddress: `0x${string}`;
  transaction: {
    signature: `0x${string}`;
    executionParams: {
      execId: string;
      deadline: string;
      metadata: `0x${string}`;
      tokens: { token: `0x${string}`; beneficiary: `0x${string}` }[];
      instructions: {
        target: `0x${string}`;
        data: `0x${string}`;
        value: string;
        tokenIn: `0x${string}`;
        amountToApprove: string;
        tokenOut: `0x${string}`;
        minTokenOut: string;
      }[];
    };
    gasLimit: string;
  };
};

export function buildExecuteArgs(env: SwapEnvelope) {
  const ep = env.transaction.executionParams;

  const params = {
    instructions: ep.instructions.map((i) => ({
      target: i.target,
      data: i.data,
      value: BigInt(i.value),
      tokenIn: i.tokenIn,
      amountToApprove: BigInt(i.amountToApprove),
      tokenOut: i.tokenOut,
      minTokenOut: BigInt(i.minTokenOut),
    })),
    tokens: ep.tokens,
    execId: BigInt(ep.execId),
    deadline: BigInt(ep.deadline),
    metadata: ep.metadata,
  };

  const isNative =
    env.tokenInAddress.toLowerCase() === NATIVE_SENTINEL.toLowerCase();

  // Pre-approval path (PermitType.NONE = 0). Native input needs no TokenInput entry.
  const tokenInputs = isNative
    ? []
    : [
        {
          permitType: 0 as const,
          token: env.tokenInAddress,
          amount: BigInt(env.amount),
          permitCalldata: '0x' as const,
        },
      ];

  // execute() is payable: send native value only when swapping FROM the native token.
  const value = isNative ? BigInt(env.amount) : BigInt(0);
  const gas = BigInt(env.transaction.gasLimit);

  return {
    params,
    tokenInputs,
    signature: env.transaction.signature,
    value,
    gas,
  };
}
