/**
 * POST /api/tasks/twitter
 * Records a Twitter task claim request. Owner manually approves via the contract.
 * Body: { walletAddress: string }
 * Returns: { ok: true, message: string }
 */
import { NextRequest, NextResponse } from 'next/server';

// In production this would write to a queue/DB for owner review.
// For now it just validates and returns instructions — owner calls approveTwitterTask() on contract.
export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json() as { walletAddress: string };
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }
    // TODO: persist to a review queue (Supabase or simple log)
    console.log(`[Twitter task] Claim request from ${walletAddress} at ${new Date().toISOString()}`);
    return NextResponse.json({
      ok: true,
      message: 'Your claim has been recorded. Points will be awarded after manual review (usually within 24 hours).',
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
