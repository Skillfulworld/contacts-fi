/**
 * GET /api/auth/nonce?address=0x...
 * Issues a one-time nonce for SIWE message signing.
 * Nonce expires in 10 minutes.
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { randomBytes } from 'crypto'

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.toLowerCase()
  if (!address || !/^0x[a-f0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
  }

  const nonce = randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const { error } = await supabaseAdmin.from('siwe_nonces').insert({
    wallet_address: address,
    nonce,
    expires_at: expiresAt,
  })

  if (error) {
    console.error('nonce insert error', error)
    return NextResponse.json({ error: 'Failed to create nonce' }, { status: 500 })
  }

  return NextResponse.json({ nonce })
}
