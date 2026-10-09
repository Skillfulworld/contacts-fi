Your answers are in — Manual approval for Twitter, wallet address as referral code. Let me update the domain first then write the full plan. Now updating the plan and then doing everything in sequence. Good. Now updating the domain everywhere and reading the current contract before extending it: This is Plan mode — I can read files and write plan documents, but all code changes, domain updates, contract work, and deployment must happen in Build mode.

Here's the complete plan for everything you asked:

---

## Updated Plan: Domain + Task System + Referrals

### Domain updates needed (Build mode)
Replace `www.settlex.click` with `www.settlex.click` in:
- `src/app/layout.tsx` — `metadataBase`
- `README.md` — live app link
- `src/app/page.tsx` — landing page links

### Contract extension (Build mode)
The existing `SettleXPoints` contract at `0xaf75c1b6...` gets extended with new functions. Since Solidity contracts are immutable, this means **redeploying** a new version. The new contract inherits all the check-in logic and adds:

1. `claimContactTask()` — trust-based, once per calendar day
2. `claimTask(bytes32 taskId, bytes sig)` — server-signed for swap (3×/day) and send (2×/day)
3. `approveTwitterTask(address user)` — only callable by owner, awards 15 pts
4. `claimReferral(address referrer)` — on-chain referral, once per wallet ever
5. Operator address stored in contract — owner can update it

### Task verification server routes (Build mode)
- `POST /api/tasks/verify-swap` — reads Uniswap Swap events for wallet, returns signed voucher if found (max 3/day tracked in contract)
- `POST /api/tasks/verify-send` — reads USDC Transfer events, returns signed voucher (max 2/day)
- `POST /api/tasks/claim-twitter` — records claim request in localStorage, owner approves separately

### Referral system (Build mode)
- `settlex.click/r/[address]` — new Next.js route that stores referrer in localStorage
- On first check-in, if referrer stored, calls `claimReferral(referrerAddress)` automatically
- Points page shows "Your referral link" with copy button

### Points page task cards (Build mode)
Each card gets a real "Claim Points" flow based on its type.

---

**Before switching to Build mode, one thing you need to prepare:**

You need a **new operator wallet** (a fresh MetaMask account or any EVM wallet you control) whose **private key** goes into Vercel as `SETTLEX_SIGNER_PRIVATE_KEY`. This wallet signs task vouchers server-side. It never receives or holds funds — it just signs messages.

You can use any wallet you control. Add its private key to `.env.local` as `SETTLEX_SIGNER_PRIVATE_KEY=0x...` before I start building.

Also — **Vercel domain setup**: go to your Vercel project → Settings → Domains → add `www.settlex.click` and follow their DNS instructions (they'll give you a CNAME pointing to `cname.vercel-dns.com`). Once that's live, your site will be accessible at `www.settlex.click`.

Ready to build? Switch to Build mode and say "start Phase 2."
