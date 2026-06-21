import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
  );
  try {
    const { reportId, bountyId, reviewerId, reviewerHash } = await req.json();

    // Generate anonymous visitor hardware/IP subhash fingerprint
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'generic-agent';
    const visitorHash = crypto.createHash('sha256').update(`${ip}-${userAgent}`).digest('hex');

    // Anti-Cheat Validation: Stop self-voting loop fraud
    if (reviewerHash === visitorHash) {
      return NextResponse.json({ error: 'Security Exception: Self-upvote payout manipulation blocked.' }, { status: 403 });
    }

    // Call database transactional RPC layout method execution safely
    const { data: transactionSuccess, error: txError } = await supabase.rpc('release_bounty_escrow', {
      target_report_id: reportId,
      target_bounty_id: bountyId,
      expected_reviewer_id: reviewerId
    });

    if (txError || !transactionSuccess) {
      return NextResponse.json({ error: txError?.message || 'Transaction failed to commit.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Escrow assets distributed securely.' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
