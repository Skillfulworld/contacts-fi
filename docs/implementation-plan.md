You're in the right place. Here are the exact steps:

---

**Step 1 — Create a Mainnet API Key**

1. In the Circle Console (mainnet toggle ON), click **Keys** in the left sidebar
2. Click **Create new key** (or similar button)
3. Name it something like "SettleX Mainnet"
4. Copy the API key — it will look like `LIVE_API_KEY:your-id:your-secret`
5. Add it to `.env.local` in the Code panel:
```
CIRCLE_API_KEY=LIVE_API_KEY:your-id:your-secret
```

**Do not paste the key in chat — only in the Code panel.**

---

**Step 2 — Entity Secret (one-time setup)**

You only need to do this once — it's a permanent cryptographic secret tied to your Circle account. I will generate it for you in Build mode. Just confirm Step 1 is done first.

---

**Step 3 — That's it**

Once the API key is in `.env.local` and confirmed, tell me and I will:
1. Generate your entity secret + recovery file
2. Register it with Circle
3. Write the `SettleXPoints.sol` contract
4. Run a security review
5. Run unit tests
6. Deploy to Arc Mainnet from your Circle account
7. Build the Supabase schema + SIWE auth + backend
8. Wire the frontend

Go ahead and create the API key and add it to `.env.local`, then come back and say "API key is in."
