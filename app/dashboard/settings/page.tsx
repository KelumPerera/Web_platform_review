import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseServerClient } from '@/app/utils/supabase';
import { cookies } from 'next/headers';

export default async function SettingsPage() {
  const supabase = await getSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const handleLogout = async () => {
    'use server';
    const cookieStore = await cookies();
    cookieStore.delete('sb-access-token');
    cookieStore.delete('sb-refresh-token');
    redirect('/login');
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-white mb-8">Settings</h1>
      
      <div className="space-y-6">
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/50">
          <h2 className="text-xl font-bold mb-6 text-white">Account</h2>
          <div className="space-y-3">
            <div>
              <span className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Email</span>
              <p className="font-medium text-neutral-200 mt-1">{user?.email}</p>
            </div>
            <div>
              <span className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">User ID</span>
              <p className="font-medium font-mono text-sm text-neutral-400 mt-1">{user?.id}</p>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/50">
          <h2 className="text-xl font-bold mb-6 text-white">Appearance</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold tracking-wide text-neutral-300">Dark Mode</span>
            <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/50">
          <h2 className="text-xl font-bold mb-6 text-white">Danger Zone</h2>
          <form action={handleLogout}>
            <button 
              type="submit"
              className="w-full bg-red-950/20 text-red-400 hover:bg-red-900/30 border border-red-900/30 hover:border-red-800 px-6 py-3 rounded-xl font-semibold transition-all text-sm active:scale-98"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
