Fill it in exactly like this:

**Type:** Secret (already selected — keep it)

**Key:** `KIT_KEY`

**Value:** paste your full key exactly as-is — `LIVE_API_KEY:your_key_id:your_key_secret` — the complete string including the prefix and both colons

**Environments:** check all three — Production, Preview, Development

**Note (optional):** `Circle Stablecoin Service API key — rotate at console.circle.com`

Then click **Save**.

That's it. Once saved, every Vercel deployment will have `process.env.KIT_KEY` available to the API routes. Then connect GitHub and I'll push the code.
