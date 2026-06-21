import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { itemId, visitorHash } = await request.json();

  if (!itemId || !visitorHash) {
    return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  // Check if user already liked
  const { data: existingLike } = await supabase
    .from('likes')
    .select('id')
    .eq('item_id', itemId)
    .eq('visitor_hash', visitorHash)
    .single();

  if (existingLike) {
    return Response.json({ success: false, error: 'Already liked' }, { status: 400 });
  }

  // Insert like
  const { error } = await supabase
    .from('likes')
    .insert({
      item_id: itemId,
      visitor_hash: visitorHash,
    });

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
