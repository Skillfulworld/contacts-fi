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

## Phase 2 — Task System + Referrals (building now)

### Tasks
| Task | Points | Daily limit | Verification |
|---|---|---|---|
| Twitter reply+repost | 15 pts | once | Manual — owner signs approval from owner wallet |
| Add a Contact | 5 pts | once | Trust-based — user claims, contract enforces once/day |
| Swap Assets | 10 pts | 3×/day | Server reads Uniswap Swap events, signs voucher |
| Send USDC | 8 pts | 2×/day | Server reads USDC Transfer events, signs voucher |
| Refer a Friend | 10 pts | unlimited | On-chain: referrer wallet = referral code; settlex.click/r/0xADDRESS |

### Twitter task: Manual approval flow
- User clicks "I've done this" → frontend records claim request
- Owner reviews and calls `approveTwitterTask(address user)` from owner wallet
- Contract awards 15 pts, marks task claimed for that epoch

### Referral flow
- Referral link: `settlex.click/r/0xREFERRER_ADDRESS`
- New user opens link → referrer address stored in localStorage
- On first check-in: frontend calls `claimReferral(referrerAddress)`
- Contract: awards 10 pts to referrer, 5 pts to new user, records pair permanently

### Contract changes (extending existing SettleXPoints.sol)
- `claimTask(bytes32 taskId, bytes calldata sig)` — server-signed voucher for swap/send
- `claimContactTask()` — trust-based, once/day
- `approveTwitterTask(address user)` — onlyOwner
- `claimReferral(address referrer)` — on-chain, once per wallet ever
- Daily reset via timestamp comparison (same pattern as check-in)
- Operator address stored in contract, set by owner

### Operator signer
- New wallet generated, private key in Vercel as `SETTLEX_SIGNER_PRIVATE_KEY`
- Public address stored in contract as `operator`
- Server signs `keccak256(abi.encodePacked(user, taskId, day))` — day = block.timestamp / 86400
- Prevents replay across days, prevents cross-task reuse

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
