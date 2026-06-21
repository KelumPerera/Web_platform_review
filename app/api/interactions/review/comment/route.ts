import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { reviewId, authorName, content } = await request.json();

    if (!reviewId || !authorName || !content) {
      return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('review_comments')
      .insert({
        review_id: reviewId,
        author_name: authorName,
        content,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, comment: data });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
