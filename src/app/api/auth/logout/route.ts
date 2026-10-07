/**
 * POST /api/auth/logout
 * Revokes the current session.
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionWallet } from '@/lib/session'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.replace(/^Bearer\s+/i, '').trim()
  if (!token) return NextResponse.json({ ok: true })

  await supabaseAdmin
    .from('siwe_sessions')
    .update({ revoked: true })
    .eq('session_token', token)

  return NextResponse.json({ ok: true })
}
