import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const next = searchParams.get('next') || '/dashboard'; // Default redirect after auth

  if (token_hash) {
    const { error } = await supabase.auth.verifyPasswordResetToken({ token_hash });
    if (!error) {
      // If password reset token is valid, redirect to a password reset page
      // For simplicity here, we'll redirect to login, assuming user will reset there.
      // A more robust solution would involve a dedicated password reset form.
      return new NextResponse(null, {
        url: new URL(`/${next}?resetTokenSuccess=true`, request.url).toString(),
        status: 302,
      });
    }
  }

  // Handle email change or other auth redirects
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // If user is already logged in, redirect to dashboard
    return new NextResponse(null, {
      url: new URL(next, request.url).toString(),
      status: 302,
    });
  }

  // If not logged in and no valid token, redirect to login page
  return new NextResponse(null, {
    url: new URL('/login', request.url).toString(),
    status: 302,
  });
}
