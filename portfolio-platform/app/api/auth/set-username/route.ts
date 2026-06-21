import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { username } = await req.json();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  // Check if username is available
  const { data: existingProfile, error: profileError } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .maybeSingle();

  if (profileError) {
    console.error('Error checking username availability:', profileError.message);
    return NextResponse.json({ error: 'Error checking username availability' }, { status: 500 });
  }

  if (existingProfile?.username) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
  }

  // Update the profile with the username
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ username: username })
    .eq('id', user.id);

  if (updateError) {
    console.error('Error updating profile with username:', updateError.message);
    return NextResponse.json({ error: 'Error setting username' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Username set successfully!' });
}
