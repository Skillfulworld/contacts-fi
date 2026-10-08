The user already answered — Vercel subdomain. Let me update the live URL in the codebase and give you the exact steps to fix MetaMask.Switch to Build mode to update the URLs. In the meantime here is the complete fix plan:

---

## Why MetaMask is flagging your site

It is not your domain name specifically. The warning comes from MetaMask's open-source blocklist called `eth-phishing-detect`. The old domain `contactfi.vercel.app` was likely submitted to that list at some point — and `settlex-on-arc.vercel.app` may be inheriting the flag because it is a Vercel subdomain on the same shared infrastructure. The "High-risk request" prompt is a separate heuristic that fires when a site calls certain wallet methods in a pattern that matches known drainers.

---

## The fix — do these in order

**Step 1 — Submit a false-positive report (do this today, free)**

Go to this URL and open a new issue:
`https://github.com/MetaMask/eth-phishing-detect/issues/new`

Title: `False positive: settlex-on-arc.vercel.app`

Body:
```
Please whitelist settlex-on-arc.vercel.app

This is a legitimate USDC payment and DeFi application built on Arc Mainnet.
It is not a phishing site. It connects wallets to allow users to send USDC,
swap tokens on Uniswap, and bridge via CCTP. No funds are drained.

GitHub repo: https://github.com/Skillfulworld/settlex
```

MetaMask maintainers typically respond within 24–48 hours and push an update to the blocklist. Once merged, the warning disappears for all MetaMask users automatically.

**Step 2 — Get a custom domain (permanent fix, ~$10/year)**

A `.io`, `.xyz`, or `.app` domain you register yourself has zero phishing history and gives you full reputation control. Vercel subdomains are shared — thousands of phishing sites have used `*.vercel.app` which poisons the reputation pool for legitimate apps.

Recommended registrars: Namecheap, Cloudflare Registrar, Google Domains. Search for `settlex.io`, `settlex.xyz`, or `settle.exchange`.

Once you have a domain:
1. Vercel → your project → Settings → Domains → Add domain
2. Point your domain's DNS to Vercel (they give you exact records)
3. Tell me the domain and I'll update `metadataBase`, the README, and landing page links in one commit

**Step 3 — In Build mode, update the live URL now**

The codebase still has `settlex.vercel.app` in a few places — I'll update those to `settlex-on-arc.vercel.app` so OG images and links are correct while you work on the custom domain.

---

The MetaMask warning is purely a reputation/blocklist problem — there is nothing malicious in your code. The false-positive report in Step 1 is the fastest path to removing it. The custom domain in Step 2 is the permanent solution. Switch to Build mode and I will handle the URL updates immediately.
