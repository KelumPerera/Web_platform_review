import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email } = await req.json();
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase.auth.signInWithEmail(email);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Check your email for the magic link.' });
}
