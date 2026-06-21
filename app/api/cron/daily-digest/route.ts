import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // Check authorization token if secured (optional, e.g. CRON_SECRET)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Needs service role key to fetch users
  );

  // 1. Get products created in the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentProducts, error: productsError } = await supabase
    .from('portfolio_items')
    .select(`
      id,
      title,
      description,
      demo_url,
      github_url,
      created_at,
      profile_id
    `)
    .eq('is_product', true)
    .gte('created_at', oneDayAgo);

  if (productsError) {
    return NextResponse.json({ success: false, error: productsError.message }, { status: 500 });
  }

  if (!recentProducts || recentProducts.length === 0) {
    return NextResponse.json({ success: true, message: 'No new products added in the last 24 hours.' });
  }

  // Fetch profiles for the products
  const profileIds = Array.from(new Set(recentProducts.map(p => p.profile_id)));
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, username')
    .in('id', profileIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  // 2. Fetch all registered users (who act as potential reviewers)
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    return NextResponse.json({ success: false, error: usersError.message }, { status: 500 });
  }

  const emails = users.map(u => u.email).filter(Boolean) as string[];
  if (emails.length === 0) {
    return NextResponse.json({ success: true, message: 'No registered reviewers found.' });
  }

  // 3. Construct premium dark-mode HTML template
  const productsListHtml = recentProducts
    .map(p => {
      const creator = profileMap.get(p.profile_id);
      const creatorName = creator?.full_name || 'Creator';
      const creatorUsername = creator?.username ? `@${creator.username}` : '';
      
      return `
        <div style="background-color: #171717; border: 1px solid #262626; border-radius: 12px; padding: 24px; margin-bottom: 20px; font-family: sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
            <h3 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.025em;">
              ${p.title}
            </h3>
            <span style="color: #a3a3a3; font-size: 12px;">By ${creatorName} ${creatorUsername}</span>
          </div>
          <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 20px;">
            ${p.description || 'No description provided.'}
          </p>
          <div style="display: flex; gap: 12px;">
            ${p.demo_url ? `
              <a href="${p.demo_url}" target="_blank" style="background-image: linear-gradient(to right, #2563eb, #3b82f6); color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 12px; font-weight: 600; display: inline-block;">
                Live Demo
              </a>
            ` : ''}
            ${p.github_url ? `
              <a href="${p.github_url}" target="_blank" style="background-color: #262626; color: #ffffff; border: 1px solid #404040; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 12px; font-weight: 600; display: inline-block;">
                GitHub Repository
              </a>
            ` : ''}
          </div>
        </div>
      `;
    })
    .join('');

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Products Added for Review</title>
      </head>
      <body style="background-color: #0a0a0a; color: #e5e5e5; font-family: system-ui, -apple-system, sans-serif; padding: 40px 20px; margin: 0;">
        <div style="max-w: 600px; margin: 0 auto;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <span style="color: #3b82f6; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; display: block; margin-bottom: 8px;">Portfolio Platform</span>
            <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.025em;">Daily Review Digest</h1>
            <p style="color: #737373; font-size: 14px; margin-top: 8px;">Here is your curated list of newly added applications ready for verification.</p>
          </div>

          <!-- Products List -->
          <div>
            ${productsListHtml}
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 40px; border-top: 1px solid #262626; padding-top: 20px;">
            <p style="color: #525252; font-size: 11px; margin: 0;">
              You are receiving this because you are a registered reviewer on Portfolio Platform.<br/>
              To stop receiving digests, update your profile settings.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  // 4. Send email via Resend API (HTTP call)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.log('--- Resend API key is missing. Logging email digest content ---');
    console.log('Sending digest to:', emails);
    console.log('HTML content preview:', emailHtml.substring(0, 500) + '...');
    return NextResponse.json({
      success: true,
      simulated: true,
      message: 'RESEND_API_KEY environment variable is missing. Simulated digest send to console.'
    });
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Portfolio Platform <digest@portfolio-platform.dev>',
        to: emails,
        subject: `Daily Digest: ${recentProducts.length} New Products Ready for Review`,
        html: emailHtml,
      }),
    });

    const sendResult = await res.json();
    return NextResponse.json({ success: true, sendResult });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
