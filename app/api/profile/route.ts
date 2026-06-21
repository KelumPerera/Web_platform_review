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
  const username = formData.get('username') as string;
  const fullName = formData.get('fullName') as string;
  const bio = formData.get('bio') as string;
  const avatarUrl = formData.get('avatarUrl') as string;

  if (!username || !fullName) {
    return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  // Check if username already exists (excluding current user)
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', user.id)
    .single();

  if (existingProfile) {
    return Response.json({ success: false, error: 'Username already taken' }, { status: 400 });
  }

  // Check if user already has a profile
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (existingUser) {
    // Update existing profile
    const { error } = await supabase
      .from('profiles')
      .update({
        username,
        full_name: fullName,
        bio,
        avatar_url: avatarUrl,
      })
      .eq('id', user.id);

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }
  } else {
    // Create new profile
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username,
        full_name: fullName,
        bio,
        avatar_url: avatarUrl,
      });

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  return Response.json({ success: true });
}
