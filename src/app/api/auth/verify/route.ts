/**
 * POST /api/auth/verify
 * Verifies an Ethereum personal_sign signature (EIP-191).
 * On success: upserts the profile in Supabase and returns a session token.
 *
 * Body: { message: string, signature: string }
 * Returns: { sessionToken: string, wallet: string, isNewUser: boolean }
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'
import { verifyMessage } from 'viem'

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

  // 1. Recover the signer address from the signature using viem
  let walletAddress: string
  try {
    const recovered = await verifyMessage({
      address: extractAddress(message) as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    })
    if (!recovered) {
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 })
    }
    walletAddress = extractAddress(message).toLowerCase()
  } catch (err) {
    console.error('Signature verification error', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  if (!walletAddress || !/^0x[a-f0-9]{40}$/.test(walletAddress)) {
    return NextResponse.json({ error: 'Could not recover wallet address' }, { status: 401 })
  }

  // 2. Upsert profile (creates row if first time)
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({ wallet_address: walletAddress }, { onConflict: 'wallet_address', ignoreDuplicates: true })

  if (profileError && profileError.code !== '23505') {
    console.error('profile upsert error', JSON.stringify(profileError))
    // Non-fatal: continue even if profile upsert fails
  }

  // Fetch profile after upsert
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('wallet_address, username, avatar_url')
    .eq('wallet_address', walletAddress)
    .single()

  // 3. Create session (7 days)
  const sessionToken = randomUUID()
  const sessionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { error: sessionError } = await supabaseAdmin.from('siwe_sessions').insert({
    wallet_address: walletAddress,
    session_token: sessionToken,
    expires_at: sessionExpires,
  })

  if (sessionError) {
    console.error('session insert error', JSON.stringify(sessionError))
    return NextResponse.json({ error: 'Session error: ' + sessionError.message }, { status: 500 })
  }

  return NextResponse.json({
    sessionToken,
    wallet: walletAddress,
    isNewUser: !profile?.username,
    profile: profile ?? { wallet_address: walletAddress, username: null, avatar_url: null },
  })
}

/**
 * Extract the Ethereum address from a SIWE-format message.
 * The address is on the second line of the message.
 */
function extractAddress(message: string): string {
  const lines = message.split('\n')
  // SIWE format: line 0 = domain statement, line 1 = address
  for (const line of lines) {
    const trimmed = line.trim()
    if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      return trimmed
    }
  }
  throw new Error('Could not extract address from message')
}
