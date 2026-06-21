import { createClient } from '@supabase/supabase-js';

export async function DELETE(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await request.json();

  if (!id) {
    return Response.json({ success: false, error: 'Missing item ID' }, { status: 400 });
  }

  // Check ownership
  const { data: item } = await supabase
    .from('portfolio_items')
    .select('profile_id, media_url')
    .eq('id', id)
    .single();

  if (!item || item.profile_id !== user.id) {
    return Response.json({ success: false, error: 'Not authorized' }, { status: 403 });
  }

  // Delete file from storage
  if (item.media_url) {
    const fileName = item.media_url.split('/').pop();
    if (fileName) {
      const filePath = `${user.id}/${fileName}`;
      await supabase.storage.from('portfolio-media').remove([filePath]);
    }
  }

  // Delete from database
  const { error } = await supabase
    .from('portfolio_items')
    .delete()
    .eq('id', id);

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
