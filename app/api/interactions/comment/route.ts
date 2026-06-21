import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { itemId, authorName, content } = await request.json();

  if (!itemId || !content) {
    return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  // Insert comment
  const { error } = await supabase
    .from('comments')
    .insert({
      item_id: itemId,
      author_name: authorName || 'Anonymous',
      content,
    });

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
