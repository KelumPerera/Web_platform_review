import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

export const revalidate = 60; // Cache embed widget for 60 seconds

interface EmbedPageProps {
  params: Promise<{ username: string; itemId: string }>;
}

export default async function EmbedReviewsPage({ params }: EmbedPageProps) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { username, itemId } = await params;

  // 1. Fetch profile and verify
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('username', username)
    .single();

  if (!profile) notFound();

  // 2. Fetch product item details
  const { data: item } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('id', itemId)
    .eq('profile_id', profile.id)
    .single();

  if (!item) notFound();

  // 3. Fetch top upvoted review reports
  const { data: reviews } = await supabase
    .from('review_reports')
    .select(`
      *,
      review_upvotes(id)
    `)
    .eq('item_id', itemId)
    .order('rating', { ascending: false })
    .limit(3);

  const parsedReviews = (reviews || []).map((r: any) => ({
    ...r,
    upvotes: r.review_upvotes?.length || 0,
  })).sort((a, b) => b.upvotes - a.upvotes);

  return (
    <div className="bg-neutral-950 text-neutral-100 p-4 min-h-screen flex flex-col justify-center">
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: #030712; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 4px; }
      ` }} />

      <div className="w-full max-w-xl mx-auto space-y-4">
        {/* Widget Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-500">Structured Audits</span>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-extrabold">
              VERIFIED BUILD
            </span>
          </div>
          <span className="text-xs text-neutral-400 font-semibold">{item.title}</span>
        </div>

        {/* Reviews List */}
        <div className="space-y-3">
          {parsedReviews.length > 0 ? (
            parsedReviews.map((r) => (
              <div key={r.id} className="p-4 bg-neutral-900/60 border border-neutral-800/80 rounded-xl space-y-2 shadow-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{r.reviewer_name}</span>
                    <span className="text-[10px] text-amber-400 font-bold">{'★'.repeat(r.rating)}</span>
                    {r.reward_paid && (
                      <span className="text-[8px] bg-green-500/10 text-green-400 border border-green-500/20 px-1.5 py-0.2 rounded font-extrabold uppercase">
                        Bounty Winner
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-500">👍 {r.upvotes} helpful</span>
                </div>
                
                {r.specs_os && (
                  <div className="flex gap-1.5 text-[8px] text-neutral-500 font-semibold uppercase tracking-wider">
                    <span>💻 {r.specs_os}</span>
                    <span>•</span>
                    <span>🌐 {r.specs_browser}</span>
                    <span>•</span>
                    <span className={r.test_passed ? 'text-green-400' : 'text-red-400'}>
                      {r.test_passed ? 'Pass' : 'Failed'}
                    </span>
                  </div>
                )}

                <p className="text-xs text-neutral-350 line-clamp-2 leading-relaxed italic">&quot;{r.summary}&quot;</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-neutral-900/40 border border-neutral-800 border-dashed rounded-xl">
              <p className="text-xs text-neutral-500 italic">No validation audits recorded yet.</p>
            </div>
          )}
        </div>

        {/* Widget Footer */}
        <div className="text-center">
          <a
            href={`https://portfolio-platform.dev/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-blue-400 hover:underline font-bold tracking-wide"
          >
            Audit this App on Portfolio Platform ↗
          </a>
        </div>
      </div>
    </div>
  );
}
