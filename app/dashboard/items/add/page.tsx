import { redirect } from 'next/navigation';
import PortfolioForm from '@/app/components/PortfolioForm';
import { getSupabaseServerClient } from '@/app/utils/supabase';

async function createItem(data: {
  title: string;
  description: string;
  mediaType: 'image' | 'video';
  isProduct: boolean;
  demoUrl?: string;
  githubUrl?: string;
  testScenarioUrl?: string;
  category?: string;
  tags?: string;
  pledgeAmount?: number;
  processorType?: 'stripe' | 'paypal';
  mediaUrl?: string;
}) {
  'use server';
  
  const supabase = await getSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Auth redirect triggered in createItem. Error:", authError?.message, "User status:", !!user);
    redirect('/login');
  }

  const { title, description, mediaType, isProduct, demoUrl, githubUrl, testScenarioUrl, category, tags, mediaUrl } = data;

  if (!title || !mediaType) {
    return { error: 'Missing required fields' };
  }

  const { data: itemData, error } = await supabase
    .from('portfolio_items')
    .insert({
      profile_id: user.id,
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
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  if (isProduct && data.pledgeAmount && data.pledgeAmount > 0) {
    const { error: escrowError } = await supabase
      .from('escrow_bounties')
      .insert({
        item_id: itemData.id,
        pledge_amount: data.pledgeAmount,
        processor_type: data.processorType || 'stripe',
        status: 'escrow'
      });
    if (escrowError) {
      console.error('Escrow creation failed:', escrowError.message);
    }
  }

  redirect('/dashboard/items');
}

export default async function AddItemPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-white mb-8">Add Portfolio Item</h1>
      
      <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/50">
        <PortfolioForm onSubmit={createItem} />
      </div>
    </div>
  );
}
