/**
 * GET /api/auth/nonce
 * Returns a random nonce for SIWE message construction.
 * Stateless — nonce is embedded in the signed message and verified by signature.
 */
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function GET() {
  const nonce = randomBytes(16).toString('hex')
  return NextResponse.json({ nonce })
}
