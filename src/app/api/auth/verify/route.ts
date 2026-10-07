/**
 * POST /api/auth/verify
 * Verifies a signed SIWE message, creates a session, and upserts the profile.
 *
 * Body: { message: string, signature: string }
 * Returns: { sessionToken: string, wallet: string, isNewUser: boolean }
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { SiweMessage } from 'siwe'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  let body: { message: string; signature: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { message, signature } = body
  if (!message || !signature) {
    return NextResponse.json({ error: 'Missing message or signature' }, { status: 400 })
  }

  // 1. Parse and verify the SIWE message
  let siwe: SiweMessage
  try {
    siwe = new SiweMessage(message)
    const result = await siwe.verify({ signature })
    if (!result.success) throw new Error('Signature invalid')
  } catch (err) {
    console.error('SIWE verify error', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const walletAddress = siwe.address.toLowerCase()
  const nonce = siwe.nonce

  // 2. Consume the nonce — must exist, not expired, not used
  const { data: nonceRow, error: nonceError } = await supabaseAdmin
    .from('siwe_nonces')
    .select('id, expires_at, used')
    .eq('wallet_address', walletAddress)
    .eq('nonce', nonce)
    .single()

  if (nonceError || !nonceRow) {
    return NextResponse.json({ error: 'Nonce not found' }, { status: 401 })
  }
  if (nonceRow.used) {
    return NextResponse.json({ error: 'Nonce already used' }, { status: 401 })
  }
  if (new Date(nonceRow.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Nonce expired' }, { status: 401 })
  }

  // Mark nonce used
  await supabaseAdmin
    .from('siwe_nonces')
    .update({ used: true })
    .eq('id', nonceRow.id)

  // 3. Upsert profile (creates if first time)
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({ wallet_address: walletAddress }, { onConflict: 'wallet_address', ignoreDuplicates: true })
    .select('wallet_address, username, avatar_url')
    .single()

  if (profileError && profileError.code !== '23505') {
    console.error('profile upsert error', profileError)
    return NextResponse.json({ error: 'Profile error' }, { status: 500 })
  }

  const isNewUser = !profile?.username

  // 4. Create session (24h)
  const sessionToken = randomUUID()
  const sessionExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { error: sessionError } = await supabaseAdmin.from('siwe_sessions').insert({
    wallet_address: walletAddress,
    session_token: sessionToken,
    expires_at: sessionExpires,
  })

  if (sessionError) {
    console.error('session insert error', sessionError)
    return NextResponse.json({ error: 'Session error' }, { status: 500 })
  }

  return NextResponse.json({
    sessionToken,
    wallet: walletAddress,
    isNewUser,
    profile: profile ?? { wallet_address: walletAddress, username: null, avatar_url: null },
  })
}
