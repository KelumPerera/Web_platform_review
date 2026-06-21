import { redirect } from 'next/navigation';
import PortfolioForm from '@/app/components/PortfolioForm';
import { getSupabaseServerClient } from '@/app/utils/supabase';

async function createItem(data: {
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

  if (!title || !mediaType) {
    return { error: 'Missing required fields' };
  }

  let mediaUrl = '';
  if (file && file.size > 0) {
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
