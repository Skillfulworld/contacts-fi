/**
 * GET /api/transactions?limit=20&offset=0&type=
 * Returns indexed on-chain transactions for the authenticated wallet.
 * Also triggers a background re-index if last sync was > 5 minutes ago.
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionWallet } from '@/lib/session'
import { indexWalletTransactions } from '@/lib/indexer'

// Simple in-memory debounce: wallet → last index timestamp
const lastIndexed = new Map<string, number>()
const INDEX_DEBOUNCE_MS = 5 * 60 * 1000

export async function GET(req: NextRequest) {
  const wallet = await getSessionWallet(req)
  if (!wallet) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '20'), 50)
  const offset = parseInt(req.nextUrl.searchParams.get('offset') ?? '0')
  const type = req.nextUrl.searchParams.get('type') // optional filter

  // Background re-index (non-blocking — don't await)
  const last = lastIndexed.get(wallet) ?? 0
  if (Date.now() - last > INDEX_DEBOUNCE_MS) {
    lastIndexed.set(wallet, Date.now())
    indexWalletTransactions(wallet).catch(console.error)
  }

  let query = supabaseAdmin
    .from('onchain_transactions')
    .select('*')
    .eq('wallet_address', wallet)
    .order('block_timestamp', { ascending: false })
    .range(offset, offset + limit - 1)

  if (type) query = query.eq('tx_type', type)

  const { data, error, count } = await query

  if (error) {
    console.error('tx fetch error', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }

  return NextResponse.json({ transactions: data ?? [], total: count ?? 0 })
}
