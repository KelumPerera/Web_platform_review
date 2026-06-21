import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('itemId');
  const metricType = searchParams.get('type') as 'demo_click' | 'repo_click';
  const targetUrl = searchParams.get('targetUrl');
  const visitorHash = searchParams.get('visitorHash') || '';

  if (!itemId || !targetUrl || !metricType) {
    return new Response('Missing required parameters', { status: 400 });
  }

  // 1. Log the click metric in database
  try {
    await supabase.from('item_analytics').insert({
      item_id: itemId,
      metric_type: metricType,
      visitor_hash: visitorHash || null,
    });
  } catch (err) {
    console.error('Failed to log click analytic event:', err);
  }

  // 2. Attach referral query parameters to outgoing URL
  const separator = targetUrl.includes('?') ? '&' : '?';
  const redirectUrl = `${targetUrl}${separator}ref=portfolio-platform`;

  return Response.redirect(redirectUrl, 307);
}
