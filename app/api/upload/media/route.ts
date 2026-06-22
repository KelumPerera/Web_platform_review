import { getSupabaseServerClient } from '@/app/utils/supabase';

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const profileId = (formData.get('profileId') as string) || 'anonymous';

    if (!file) {
      return Response.json({ success: false, error: 'Missing file' }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const filePath = `${profileId}/${fileName}`;

    // Explicitly fallback/set contentType for markdown files.
    // Supabase bucket MIME restrictions may block 'text/markdown' and 'text/plain', so we upload it as 'application/octet-stream' which is universally allowed.
    let contentType = file.type;
    if (fileExtension.toLowerCase() === 'md') {
      contentType = 'application/octet-stream';
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('portfolio-media')
      .upload(filePath, fileBuffer, {
        contentType: contentType || 'application/octet-stream',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return Response.json({ success: false, error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('portfolio-media')
      .getPublicUrl(filePath);

    return Response.json({ 
      success: true, 
      url: publicUrl,
      fileName: fileName
    });
  } catch (error) {
    return Response.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
