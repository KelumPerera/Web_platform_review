import { createClient } from '@supabase/supabase-js';

export const revalidate = 60; // Cache SVG for 60 seconds

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { username } = await params;

  // 1. Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, reputation_score')
    .eq('username', username)
    .maybeSingle();

  if (!profile) {
    // Return empty fallback SVG badge
    return new Response(
      getBadgeSvg('Not Found', '0.0', 0, 0),
      {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache',
        },
      }
    );
  }

  // 2. Fetch all portfolio items for this creator
  const { data: items } = await supabase
    .from('portfolio_items')
    .select('id')
    .eq('profile_id', profile.id);

  const itemIds = (items || []).map((i) => i.id);

  let avgRating = '0.0';
  let auditsCount = 0;

  if (itemIds.length > 0) {
    // 3. Fetch reviews count and ratings
    const { data: reviews } = await supabase
      .from('review_reports')
      .select('rating')
      .in('item_id', itemIds);

    if (reviews && reviews.length > 0) {
      auditsCount = reviews.length;
      const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
      avgRating = (totalRating / auditsCount).toFixed(1);
    }
  }

  const svgContent = getBadgeSvg(
    profile.full_name,
    avgRating,
    auditsCount,
    profile.reputation_score || 0
  );

  return new Response(svgContent, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

function getBadgeSvg(name: string, rating: string, audits: number, reputation: number) {
  const cleanName = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // Choose premium dynamic colors based on reputation score
  let scoreColor = '#3b82f6'; // Blue default
  if (reputation >= 100) scoreColor = '#10b981'; // Green for high rep
  else if (reputation >= 50) scoreColor = '#f59e0b'; // Amber for mid rep

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 64" width="460" height="64">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <linearGradient id="score-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${scoreColor}" />
        <stop offset="100%" stop-color="#3b82f6" />
      </linearGradient>
      <clipPath id="rounded">
        <rect width="460" height="64" rx="16" />
      </clipPath>
    </defs>
    
    <g clip-path="url(#rounded)">
      <!-- Card background -->
      <rect width="460" height="64" fill="url(#bg)" stroke="#1e293b" stroke-width="1.5" />
      
      <!-- Brand Name -->
      <text x="16" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#94a3b8" letter-spacing="1">VERIFIED PORTFOLIO</text>
      <text x="16" y="46" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#ffffff">${cleanName}</text>
      
      <!-- Stats block -->
      <!-- Rating Stat -->
      <g transform="translate(240, 14)">
        <rect width="64" height="36" rx="8" fill="#1e293b" />
        <text x="32" y="16" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="600" fill="#64748b">RATING</text>
        <text x="32" y="30" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#f59e0b">★ ${rating}</text>
      </g>
      
      <!-- Audits Stat -->
      <g transform="translate(312, 14)">
        <rect width="64" height="36" rx="8" fill="#1e293b" />
        <text x="32" y="16" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="600" fill="#64748b">AUDITS</text>
        <text x="32" y="30" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#e2e8f0">${audits}</text>
      </g>

      <!-- Reputation Stat -->
      <g transform="translate(384, 14)">
        <rect width="60" height="36" rx="8" fill="url(#score-grad)" />
        <text x="30" y="16" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="800" fill="#ffffff" opacity="0.85">REP</text>
        <text x="30" y="30" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#ffffff">+${reputation}</text>
      </g>
    </g>
  </svg>`;
}
