/**
 * GET  /api/profile          — get own profile (requires session)
 * GET  /api/profile?wallet=  — get any profile by wallet (public)
 * PATCH /api/profile         — update own profile (requires session)
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionWallet } from '@/lib/session'

export async function GET(req: NextRequest) {
  const walletParam = req.nextUrl.searchParams.get('wallet')?.toLowerCase()

  if (walletParam) {
    // Public profile lookup
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('wallet_address, username, avatar_url, bio, created_at')
      .eq('wallet_address', walletParam)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    return NextResponse.json(data)
  }

  // Own profile — requires session
  const wallet = await getSessionWallet(req)
  if (!wallet) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('wallet_address, username, avatar_url, bio, created_at, updated_at')
    .eq('wallet_address', wallet)
    .single()

  if (error || !data) {
    // Auto-create profile if it somehow doesn't exist
    await supabaseAdmin.from('profiles').insert({ wallet_address: wallet })
    return NextResponse.json({ wallet_address: wallet, username: null, avatar_url: null, bio: null })
  }

  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const wallet = await getSessionWallet(req)
  if (!wallet) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { username?: string; avatar_url?: string; bio?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Validate username
  if (body.username !== undefined) {
    const u = body.username.trim()
    if (u.length < 2 || u.length > 32) {
      return NextResponse.json({ error: 'Username must be 2–32 characters' }, { status: 400 })
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(u)) {
      return NextResponse.json({ error: 'Username may only contain letters, numbers, _, ., -' }, { status: 400 })
    }
    body.username = u
  }

  const updates: Record<string, string> = {}
  if (body.username !== undefined) updates.username = body.username
  if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url
  if (body.bio !== undefined) updates.bio = body.bio.slice(0, 280)

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('wallet_address', wallet)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }
    console.error('profile update error', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json(data)
}
