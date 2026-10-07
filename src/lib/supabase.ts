import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Browser / frontend client — respects RLS
export const supabase = createClient(url, anon)

// Server-only admin client — bypasses RLS (never send to browser)
export const supabaseAdmin = createClient(url, service, {
  auth: { persistSession: false },
})
