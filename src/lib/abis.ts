// Hand-declared Circle Adapter Contract ABI.
// The ERC-20 ABI is imported from viem — do not redeclare it here.
// Source: Circle swap-kit internal prepareEvmSwapAction.ts (public ABI, stable interface).
export const adapterContractAbi = [
  {
    type: 'function',
    name: 'execute',
    stateMutability: 'payable',
    outputs: [],
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          {
            name: 'instructions',
            type: 'tuple[]',
            components: [
              { name: 'target', type: 'address' },
              { name: 'data', type: 'bytes' },
              { name: 'value', type: 'uint256' },
              { name: 'tokenIn', type: 'address' },
              { name: 'amountToApprove', type: 'uint256' },
              { name: 'tokenOut', type: 'address' },
              { name: 'minTokenOut', type: 'uint256' },
            ],
          },
          {
            name: 'tokens',
            type: 'tuple[]',
            components: [
              { name: 'token', type: 'address' },
              { name: 'beneficiary', type: 'address' },
            ],
          },
          { name: 'execId', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'metadata', type: 'bytes' },
        ],
      },
      {
        name: 'tokenInputs',
        type: 'tuple[]',
        components: [
          { name: 'permitType', type: 'uint8' }, // 0 = NONE (pre-approval), 1 = EIP-2612
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'permitCalldata', type: 'bytes' },
        ],
      },
      { name: 'signature', type: 'bytes' },
    ],
  },
] as const;
