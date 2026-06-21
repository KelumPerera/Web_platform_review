import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { email, password, name } = await req.json();

  // 1. Sign up the user
  const { data: { user }, error: signupError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signupError) {
    return NextResponse.json({ error: signupError.message }, { status: 400 });
  }

  // 2. If signup is successful, create the profile
  if (user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: name,
        // username will be set during onboarding
      });

    if (profileError) {
      // If profile creation fails, clean up by deleting the user
      await supabase.auth.admin.deleteUser(user.id);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Send a magic link email for verification
    const { error: magicLinkError } = await supabase.auth.admin.generateLink({
      type: 'email_change', // Use email_change to send verification email
      email,
    });

    if (magicLinkError) {
      // If magic link fails, still inform user about signup success but flag potential issue
      console.error("Failed to send magic link:", magicLinkError.message);
      return NextResponse.json({ 
        message: 'User signed up successfully, but failed to send verification email. Please contact support.', 
        user 
      });
    }

    return NextResponse.json({ message: 'Signup successful. Please check your email for verification.', user });
  }

  return NextResponse.json({ error: 'Signup failed. No user object returned.' }, { status: 500 });
}
