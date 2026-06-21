import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSessionUser } from '@/app/utils/supabase';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; callbackUrl?: string }>;
}) {
  const resolvedParams = await searchParams;

  const user = await getSessionUser();

  if (user) {
    redirect(resolvedParams?.callbackUrl || '/dashboard');
  }

  const signIn = async (formData: FormData) => {
    'use server';
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const callbackUrl = formData.get('callbackUrl') as string;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return redirect('/login?message=Invalid credentials');
    }

    const cookieStore = await cookies();
    cookieStore.set('sb-access-token', data.session.access_token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: data.session.expires_in,
    });
    cookieStore.set('sb-refresh-token', data.session.refresh_token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    redirect(callbackUrl || '/dashboard');
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-500">Portfolio Platform</h1>
          <p className="mt-2 text-neutral-400">Sign in to your account</p>
        </div>

        {resolvedParams?.message && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-center">
            {resolvedParams.message}
          </div>
        )}

        <form action={signIn} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input 
              type="email" 
              name="email"
              required
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input 
              type="password" 
              name="password"
              required
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <input 
            type="hidden" 
            name="callbackUrl" 
            value={resolvedParams?.callbackUrl || '/dashboard'} 
          />

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Sign In
          </button>
        </form>

        <div className="text-center">
          <p className="text-neutral-400">
            Don't have an account?{' '}
            <a href="/signup" className="text-blue-500 hover:text-blue-400 font-semibold">
              Sign up
            </a>
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            <a href="/login" className="hover:text-neutral-400">Forgot your password?</a>
          </p>
        </div>
      </div>
    </div>
  );
}
