import { redirect } from 'next/navigation';
import PortfolioForm from '@/app/components/PortfolioForm';
import { getSupabaseServerClient } from '@/app/utils/supabase';

async function updateItem(id: string, data: {
  title: string;
  description: string;
  mediaType: 'image' | 'video';
  file?: File;
  isProduct: boolean;
  demoUrl?: string;
  githubUrl?: string;
  testScenarioUrl?: string;
  category?: string;
  tags?: string;
  pledgeAmount?: number;
  processorType?: 'stripe' | 'paypal';
}) {
  'use server';
  
  const supabase = await getSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { title, description, mediaType, file, isProduct, demoUrl, githubUrl, testScenarioUrl, category, tags } = data;

  if (!id || !title) {
    return { error: 'Missing required fields' };
  }

  // Check ownership
  const { data: item } = await supabase
    .from('portfolio_items')
    .select('profile_id, media_url')
    .eq('id', id)
    .single();

  if (!item || item.profile_id !== user.id) {
    redirect('/dashboard/items');
  }

  let mediaUrl = item.media_url;
  if (file && file.size > 0) {
    // Delete old file
    if (item.media_url) {
      const fileName = item.media_url.split('/').pop();
      if (fileName) {
        const filePath = `${user.id}/${fileName}`;
        await supabase.storage.from('portfolio-media').remove([filePath]);
      }
    }

    // Upload new file
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const filePath = `${user.id}/${fileName}`;

    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('portfolio-media')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('portfolio-media')
      .getPublicUrl(filePath);

    mediaUrl = publicUrl;
  }

  const { error } = await supabase
    .from('portfolio_items')
    .update({
      title,
      description,
      media_url: mediaUrl,
      media_type: mediaType,
      is_product: isProduct,
      demo_url: demoUrl || null,
      github_url: githubUrl || null,
      test_scenario_url: testScenarioUrl || null,
      category: category || null,
      tags: tags || null,
    })
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  // Update or insert escrow bounty
  if (isProduct && data.pledgeAmount && data.pledgeAmount > 0) {
    const { data: existingBounty } = await supabase
      .from('escrow_bounties')
      .select('id')
      .eq('item_id', id)
      .eq('status', 'escrow')
      .maybeSingle();

    if (existingBounty) {
      await supabase
        .from('escrow_bounties')
        .update({
          pledge_amount: data.pledgeAmount,
          processor_type: data.processorType || 'stripe'
        })
        .eq('id', existingBounty.id);
    } else {
      await supabase
        .from('escrow_bounties')
        .insert({
          item_id: id,
          pledge_amount: data.pledgeAmount,
          processor_type: data.processorType || 'stripe',
          status: 'escrow'
        });
    }
  }

  redirect('/dashboard/items');
}

async function deleteItem(formData: FormData) {
  'use server';
  
  const supabase = await getSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const id = formData.get('id') as string;

  const { data: item } = await supabase
    .from('portfolio_items')
    .select('profile_id, media_url')
    .eq('id', id)
    .single();

  if (!item || item.profile_id !== user.id) {
    redirect('/dashboard/items');
  }

  // Delete file
  if (item.media_url) {
    const fileName = item.media_url.split('/').pop();
    if (fileName) {
      const filePath = `${user.id}/${fileName}`;
      await supabase.storage.from('portfolio-media').remove([filePath]);
    }
  }

  // Delete from database
  await supabase.from('portfolio_items').delete().eq('id', id);

  redirect('/dashboard/items');
}

async function addChangelog(formData: FormData) {
  'use server';
  const supabase = await getSupabaseServerClient();

  const itemId = formData.get('itemId') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const changeType = formData.get('changeType') as 'feature' | 'fix' | 'improvement';

  if (!itemId || !title || !description || !changeType) {
    return;
  }

  await supabase.from('project_changelogs').insert({
    item_id: itemId,
    title,
    description,
    change_type: changeType
  });

  redirect(`/dashboard/items/${itemId}`);
}

async function deleteChangelog(formData: FormData) {
  'use server';
  const supabase = await getSupabaseServerClient();

  const id = formData.get('id') as string;
  const itemId = formData.get('itemId') as string;

  await supabase.from('project_changelogs').delete().eq('id', id);

  redirect(`/dashboard/items/${itemId}`);
}

async function releaseBountyEscrow(formData: FormData) {
  'use server';
  const supabase = await getSupabaseServerClient();
  const bountyId = formData.get('bountyId') as string;
  const reviewId = formData.get('reviewId') as string;
  const itemId = formData.get('itemId') as string;
  const reviewerName = formData.get('reviewerName') as string;

  if (!bountyId || !reviewId || !itemId) return;

  // Execute atomic payout transaction in Postgres via RPC (SELECT FOR UPDATE row-locking enabled)
  await supabase.rpc('release_bounty_escrow', {
    p_bounty_id: bountyId,
    p_review_id: reviewId,
    p_reviewer_name: reviewerName || ''
  });

  redirect(`/dashboard/items/${itemId}`);
}

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await getSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { id } = await params;

  const { data: item } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('id', id)
    .single();

  if (!item) {
    redirect('/dashboard/items');
  }

  const { data: updates } = await supabase
    .from('project_changelogs')
    .select('*')
    .eq('item_id', item.id)
    .order('created_at', { ascending: false });

  const { data: bounty } = await supabase
    .from('escrow_bounties')
    .select('*')
    .eq('item_id', item.id)
    .eq('status', 'escrow')
    .maybeSingle();

  const { data: reviews } = await supabase
    .from('review_reports')
    .select('*')
    .eq('item_id', item.id)
    .order('created_at', { ascending: false });

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  const { data: analytics } = await supabase
    .from('item_analytics')
    .select('metric_type')
    .eq('item_id', item.id);

  const demoClicks = (analytics || []).filter((a: any) => a.metric_type === 'demo_click').length;
  const repoClicks = (analytics || []).filter((a: any) => a.metric_type === 'repo_click').length;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-neutral-900/50 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/50 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Edit Portfolio Item</h1>
          {bounty && (
            <span className="text-[11px] bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              💰 Active Escrow Bounty: ${bounty.pledge_amount} ({bounty.processor_type})
            </span>
          )}
        </div>

        {/* Current Media Display */}
        <div>
          <label className="block text-sm font-medium mb-2">Current Media</label>
          <div className="bg-neutral-800 rounded-lg overflow-hidden">
            {item.media_type === 'image' ? (
              <img src={item.media_url} alt={item.title} className="w-full h-64 object-cover" />
            ) : (
              <video src={item.media_url} controls className="w-full h-64 object-cover" />
            )}
          </div>
        </div>

        {/* Form */}
        <PortfolioForm 
          initialData={{
            title: item.title,
            description: item.description,
            mediaType: item.media_type,
            mediaUrl: item.media_url,
            isProduct: item.is_product,
            demoUrl: item.demo_url,
            githubUrl: item.github_url,
            testScenarioUrl: item.test_scenario_url,
            category: item.category,
            tags: item.tags,
            pledgeAmount: bounty?.pledge_amount || 0,
            processorType: bounty?.processor_type || 'stripe',
          }}
          onSubmit={async (formData) => {
            'use server';
            await updateItem(item.id, formData);
          }}
        />

        {/* Delete Button */}
        <form action={deleteItem} className="pt-4 border-t border-neutral-800">
          <input type="hidden" name="id" value={item.id} />
          <button 
            type="submit"
            className="w-full bg-red-950/20 text-red-400 hover:bg-red-900/30 border border-red-900/30 hover:border-red-800 px-6 py-3 rounded-xl font-semibold transition-all text-sm"
          >
            Delete Item
          </button>
        </form>

        {/* B2B Marketplace Reviews List with Escrow Release */}
        {item.is_product && (
          <div className="pt-6 border-t border-neutral-800 space-y-4">
            <h3 className="text-lg font-bold text-neutral-200">Submitted Technical Audits ({reviews?.length || 0})</h3>
            <div className="space-y-4">
              {reviews && reviews.length > 0 ? (
                reviews.map((r) => (
                  <div key={r.id} className="p-5 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <strong className="text-white text-sm">{r.reviewer_name}</strong>
                        <span className="text-xs text-amber-400">{'★'.repeat(r.rating)}</span>
                        {r.reward_paid && (
                          <span className="text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            ✓ Bounty Winner (Paid)
                          </span>
                        )}
                      </div>
                      {r.specs_os && (
                        <div className="flex gap-2 text-[10px] text-neutral-500">
                          <span>💻 OS: {r.specs_os}</span>
                          <span>•</span>
                          <span>🌐 Browser: {r.specs_browser}</span>
                          {r.specs_resolution && (
                            <>
                              <span>•</span>
                              <span>🖥 {r.specs_resolution}</span>
                            </>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-neutral-450 leading-relaxed text-neutral-350">{r.summary}</p>
                    </div>

                    {bounty && !r.reward_paid && (
                      <form action={releaseBountyEscrow} className="shrink-0">
                        <input type="hidden" name="bountyId" value={bounty.id} />
                        <input type="hidden" name="reviewId" value={r.id} />
                        <input type="hidden" name="itemId" value={item.id} />
                        <input type="hidden" name="reviewerName" value={r.reviewer_name} />
                        <button
                          type="submit"
                          className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow"
                        >
                          Release Reward (${bounty.pledge_amount})
                        </button>
                      </form>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-500 italic">No audits submitted for this product yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Column */}
      <div className="space-y-6">
        {item.is_product && (
          <>
            {/* Analytics Stats Grid */}
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-6 shadow-2xl shadow-black/50 space-y-4">
              <h2 className="text-lg font-bold text-white">Product Performance</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/60 text-center">
                  <span className="text-2xl block mb-1">🚀</span>
                  <span className="text-xl font-extrabold text-white">{demoClicks}</span>
                  <p className="text-[10px] text-neutral-450 font-semibold uppercase mt-0.5">Demo Clicks</p>
                </div>
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/60 text-center">
                  <span className="text-2xl block mb-1">💻</span>
                  <span className="text-xl font-extrabold text-white">{repoClicks}</span>
                  <p className="text-[10px] text-neutral-450 font-semibold uppercase mt-0.5">Repo Clicks</p>
                </div>
              </div>
              <div className="bg-neutral-950/40 border border-neutral-800 p-3 rounded-lg flex items-center justify-between text-xs">
                <span className="text-neutral-400 font-medium">Uptime Health</span>
                <span className="flex items-center gap-1.5 font-bold text-green-400">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  Operational
                </span>
              </div>
            </div>

            {/* Widget Snippet Exporter Box */}
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-6 shadow-2xl shadow-black/50 space-y-4">
              <h2 className="text-lg font-bold text-white">Verification Widgets</h2>
              <p className="text-xs text-neutral-450 leading-relaxed">Display live ratings and technical audit testimonials directly on your GitHub repos and marketing sites.</p>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold text-neutral-400 uppercase mb-1">1. GitHub README Badge (Markdown)</label>
                  <textarea
                    readOnly
                    rows={2}
                    defaultValue={`[![Verified on Portfolio Platform](https://localhost:3000/api/badge/${profile?.username || 'username'})](https://localhost:3000/${profile?.username || 'username'})`}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-[10px] font-mono text-neutral-300 focus:outline-none select-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-neutral-400 uppercase mb-1">2. Audit Testimonials Iframe (HTML)</label>
                  <textarea
                    readOnly
                    rows={2}
                    defaultValue={`<iframe src="https://localhost:3000/embed/${profile?.username || 'username'}/${item.id}" width="100%" height="320" style="border:none;border-radius:12px;" />`}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-[10px] font-mono text-neutral-300 focus:outline-none select-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-neutral-400 uppercase mb-1">3. Continuous Validation GitHub Webhook</label>
                  <p className="text-[10px] text-neutral-500 mb-1 leading-normal">Configure in repo Settings &gt; Webhooks targeting:</p>
                  <input
                    type="text"
                    readOnly
                    defaultValue={`https://localhost:3000/api/webhooks/github?itemId=${item.id}`}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-[10px] font-mono text-neutral-300 focus:outline-none select-all"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {item.is_product ? (
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-6 shadow-2xl shadow-black/50 space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white">Improvement Log</h2>
              <p className="text-xs text-neutral-400 mt-1">Record updates, bugs fixed, or features added to show reviewers your progress.</p>
            </div>

            {/* Add Changelog Form */}
            <form action={addChangelog} className="space-y-4 pt-4 border-t border-neutral-800">
              <input type="hidden" name="itemId" value={item.id} />
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">Update Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Added user login page"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">Description / Notes</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  placeholder="What changed?"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">Type</label>
                <select
                  name="changeType"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
                >
                  <option value="improvement">Improvement</option>
                  <option value="feature">New Feature</option>
                  <option value="fix">Bug Fix</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold text-sm transition-colors"
              >
                Log Improvement
              </button>
            </form>

            {/* List of Updates */}
            <div className="space-y-4 pt-4 border-t border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-200">Logged Updates ({updates?.length || 0})</h3>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {updates && updates.length > 0 ? (
                  updates.map((update) => (
                    <div key={update.id} className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1 relative group">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          update.change_type === 'feature' ? 'bg-green-500/10 text-green-400' :
                          update.change_type === 'fix' ? 'bg-red-500/10 text-red-400' :
                          'bg-blue-500/10 text-blue-400'
                        }`}>
                          {update.change_type}
                        </span>
                        <form action={deleteChangelog}>
                          <input type="hidden" name="id" value={update.id} />
                          <input type="hidden" name="itemId" value={item.id} />
                          <button
                            type="submit"
                            className="text-neutral-500 hover:text-red-400 text-xs transition-colors opacity-0 group-hover:opacity-100"
                          >
                            ✕
                          </button>
                        </form>
                      </div>
                      <h4 className="font-semibold text-sm text-neutral-200">{update.title}</h4>
                      <p className="text-xs text-neutral-400">{update.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-500 italic text-center py-4">No improvements logged yet.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-900/50 p-6 rounded-xl border border-neutral-800 border-dashed text-center space-y-2">
            <span className="text-3xl">🚀</span>
            <h3 className="font-bold text-sm text-neutral-400">Not a product</h3>
            <p className="text-xs text-neutral-500">Toggle &quot;Convert to reviewable Product&quot; to enable the improvement changelog.</p>
          </div>
        )}
      </div>
    </div>
  );
}
