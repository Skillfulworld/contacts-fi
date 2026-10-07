# SettleXPoints Contract — Implementation Plan

## Summary
Deploy a `SettleXPoints` smart contract on Arc Mainnet that permanently records each wallet's check-in history, points total, and streak. Users pay 0.01 USDC per check-in (plus gas in USDC) — the fee goes to the platform wallet. The frontend `usePoints` hook swaps localStorage for on-chain reads/writes.

## Architecture
- **Blockchain:** Arc Mainnet (chain ID 5042)
- **Contract:** `SettleXPoints.sol` — Phase 1 (check-in only). Ownable, upgradeable fee, USDC transferFrom for 0.01 fee, timestamp-gated daily check-in, 7-day streak rewards, 30-day grand prize, event emission. Designed to be extended in Phase 2 with server-signed task claims.
- **Frontend:** `usePoints.ts` reads from contract on wallet connect, writes via writeContract on check-in
- **Wallet:** existing WalletContext EIP-1193 provider — no changes

## User Answers
- Fee disclosure: prominent "Check-in costs 0.01 USDC" on button before every sign
- Upgradeability: owner-controlled now, placeholder for governance later
- Platform wallet: provided in Build mode during deploy
- Scope: check-in only for Phase 1 — task system added in Phase 2
- Operator wallet for task signing: discussed separately before Phase 2

## Phase 2 (future — do not build yet)
- Server-signed task claims: `claimTaskPoints(taskId, signature)`
- Operator/signer wallet: dedicated key stored in Vercel env vars, never in frontend
- Tasks: swap on SettleX DEX, bridge via CCTP, send USDC — all verifiable via on-chain event indexing
- Direct task recording: `recordDirectTask(address user, taskId)` callable only by operator
- Wrapper contract option: SettleXRouter wraps Uniswap + records task atomically

## Files to Create/Modify
1. `contracts/SettleXPoints.sol` — the smart contract
2. `contracts/test/SettleXPoints.t.sol` — Foundry unit tests
3. `src/hooks/usePoints.ts` — swap localStorage for on-chain read/write
4. `src/components/CheckInPanel.tsx` — fee disclosure + approve step
5. `.env.local` — add SETTLEX_POINTS_ADDRESS after deploy

## Build Sequence
1. Write SettleXPoints.sol
2. Audit (balanced — Critical + High, auto-fix, Slither)
3. Unit tests with Foundry
4. Deploy to Arc Mainnet (platform wallet address provided at this step)
5. Update usePoints.ts — on-chain read/write
6. Update CheckInPanel.tsx — fee notice + approve flow
7. Build and verify

## Done When
- [ ] Contract deployed to Arc Mainnet with verified address
- [ ] User connects wallet → points and streak load from chain instantly
- [ ] Check-in shows "costs 0.01 USDC" before signing
- [ ] MetaMask shows exact USDC transfer to platform wallet
- [ ] Points accumulate on-chain, visible on Arc explorer
- [ ] Owner can call setCheckInFee(0) to disable fee
- [ ] npm run build passes with 0 errors
