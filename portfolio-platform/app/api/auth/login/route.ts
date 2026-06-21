import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // Optionally, you can fetch user profile data here if needed
  // const { data: profile } = await supabase
  //   .from('profiles')
  //   .select('*')
  //   .eq('id', data.user.id)
  //   .single();

  return NextResponse.json({ user: data.user, /* profile */ });
}
