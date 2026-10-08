In your Vercel project, go to **Settings → Environment Variables**. Add these one by one:

---

**1. `KIT_KEY`**
Value: your Circle Kit API key (format `LIVE_API_KEY:xxxx:xxxx`)
Environments: Production, Preview, Development

---

**2. `NEXT_PUBLIC_SUPABASE_URL`**
Value: `https://xxxxxxxxxxxx.supabase.co` (your Supabase project URL)
Environments: Production, Preview, Development

---

**3. `NEXT_PUBLIC_SUPABASE_ANON_KEY`**
Value: the long `eyJ...` anon key from Supabase
Environments: Production, Preview, Development

---

**4. `SUPABASE_SERVICE_ROLE_KEY`**
Value: the long `eyJ...` service role key from Supabase
Environments: Production, Preview, Development ← **do not tick "Expose to browser"** if Vercel asks

---

**5. `NEXT_PUBLIC_SETTLEX_POINTS_ADDRESS`**
Value: `0xaf75c1b6EDeE3Cf03FF1282145dD7878EcFfB7B0`
Environments: Production, Preview, Development

---

**6. `CIRCLE_API_KEY`**
Value: your Circle mainnet API key (format `LIVE_API_KEY:xxxx:xxxx`)
Environments: Production, Preview, Development

---

**7. `CIRCLE_ENTITY_SECRET`**
Value: the 32-byte hex entity secret you saved earlier
Environments: Production, Preview, Development ← **server only, never expose to browser**

---

After adding all seven, click **Save** on each one, then go to **Deployments → Redeploy** (or just push a new commit from Build mode and it will auto-deploy).

Once Vercel gives you the live URL, come back and tell me what it is — I'll update the README and landing page links in one commit.
