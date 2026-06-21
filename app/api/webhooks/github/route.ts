import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Bypass RLS to safely inject system changelogs
);

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: 'Missing authenticity token parameters.' }, { status: 401 });
    }

    // Compute expected HMAC-SHA256 signature hash
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = Buffer.from('sha256=' + hmac.update(rawBody).digest('hex'), 'utf8');
    const checksum = Buffer.from(signature, 'utf8');

    // Secure timing-safe execution comparison
    if (digest.length !== checksum.length || !crypto.timingSafeEqual(digest, checksum)) {
      return NextResponse.json({ error: 'Invalid payload signature validation.' }, { status: 403 });
    }

    const payload = JSON.parse(rawBody);
    
    // Only parse standard commit 'push' events
    if (!payload.commits || payload.commits.length === 0) {
      return NextResponse.json({ message: 'Payload received, no commits discovered.' }, { status: 200 });
    }

    // Extract repository URL to locate matching portfolio item record mapping row
    const repoUrl = payload.repository?.html_url;
    if (!repoUrl) {
      return NextResponse.json({ error: 'Repository URL missing in webhook payload.' }, { status: 400 });
    }

    const { data: item, error: itemErr } = await supabase
      .from('portfolio_items')
      .select('id')
      .eq('github_url', repoUrl)
      .single();

    if (itemErr || !item) {
      return NextResponse.json({ error: 'Associated portfolio repository target not registered.' }, { status: 404 });
    }

    // Loop through individual commits and append to project timeline
    for (const commit of payload.commits) {
      const message = commit.message || '';
      let changeType: 'feature' | 'fix' | 'improvement' = 'improvement';

      if (message.startsWith('[feat]')) changeType = 'feature';
      if (message.startsWith('[fix]')) changeType = 'fix';

      await supabase.from('project_changelogs').insert({
        item_id: item.id,
        title: message.replace(/^\[(feat|fix|improvement)\]\s*/i, ''),
        change_type: changeType,
        description: `Automated sync update via commit entry ${commit.id?.substring(0, 7) || ''}${commit.author?.name ? ' by ' + commit.author.name : ''}.`
      });
    }

    return NextResponse.json({ success: true, processed: payload.commits.length }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
