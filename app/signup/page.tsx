import { redirect } from 'next/navigation';
import { getSessionUser, getSupabaseServerClient } from '@/app/utils/supabase';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; callbackUrl?: string }>;
}) {
  const resolvedParams = await searchParams;

  const user = await getSessionUser();

  if (user) {
    redirect(resolvedParams?.callbackUrl || '/dashboard');
  }

  const signUp = async (formData: FormData) => {
    'use server';
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const username = formData.get('username') as string;
    const callbackUrl = formData.get('callbackUrl') as string;

    const supabase = await getSupabaseServerClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username,
        },
      },
    });

    if (error) {
      return redirect(`/signup?message=${error.message}`);
    }

    redirect('/login?message=Account created! Please verify your email and sign in.');
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-500">Portfolio Platform</h1>
          <p className="mt-2 text-neutral-400">Create your account</p>
        </div>

        {resolvedParams?.message && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-center">
            {resolvedParams.message}
          </div>
        )}

        <form action={signUp} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input 
              type="text" 
              name="fullName"
              required
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input 
              type="text" 
              name="username"
              required
              minLength={3}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="johndoe"
            />
            <p className="text-xs text-neutral-500 mt-1">Must be at least 3 characters</p>
          </div>

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
              minLength={6}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
            <p className="text-xs text-neutral-500 mt-1">Must be at least 6 characters</p>
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
            Create Account
          </button>
        </form>

        <div className="text-center">
          <p className="text-neutral-400">
            Already have an account?{' '}
            <a href="/login" className="text-blue-500 hover:text-blue-400 font-semibold">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
