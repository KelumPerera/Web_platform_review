import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const mediaType = formData.get('mediaType') as 'image' | 'video';
  const file = formData.get('file') as File;

  if (!title || !mediaType) {
    return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  // Upload file to Supabase Storage
  let mediaUrl = '';
  if (file) {
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
      return Response.json({ success: false, error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('portfolio-media')
      .getPublicUrl(filePath);

    mediaUrl = publicUrl;
  }

  // Insert into database
  const { error: insertError } = await supabase
    .from('portfolio_items')
    .insert({
      profile_id: user.id,
      title,
      description,
      media_url: mediaUrl,
      media_type: mediaType,
    });

  if (insertError) {
    return Response.json({ success: false, error: insertError.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
