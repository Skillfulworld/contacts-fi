/**
 * SIWE session helpers — server-side only.
 * Session token is a random UUID stored in the siwe_sessions table.
 * The client sends it as Bearer token in Authorization header.
 */
import { supabaseAdmin } from './supabase'

export async function getSessionWallet(req: Request): Promise<string | null> {
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.replace(/^Bearer\s+/i, '').trim()
  if (!token) return null

  const { data, error } = await supabaseAdmin
    .from('siwe_sessions')
    .select('wallet_address, expires_at, revoked')
    .eq('session_token', token)
    .single()

  if (error || !data) return null
  if (data.revoked) return null
  if (new Date(data.expires_at) < new Date()) return null

  return data.wallet_address as string
}
