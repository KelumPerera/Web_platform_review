import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const profileId = (formData.get('profileId') as string) || 'anonymous';

    if (!file) {
      return Response.json({ success: false, error: 'Missing file' }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const filePath = `${profileId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('portfolio-media')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
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
