import { cookies } from 'next/headers';
import { getSessionUser } from '@/app/utils/supabase';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Navbar() {
  const user = await getSessionUser();

  const handleLogout = async () => {
    'use server';
    const cookieStore = await cookies();
    cookieStore.delete('sb-access-token');
    cookieStore.delete('sb-refresh-token');
    redirect('/login');
  };

  return (
    <nav className="bg-neutral-900 border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold text-blue-500">
              Portfolio Platform
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-neutral-300 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/explore" className="text-neutral-300 hover:text-white transition-colors">
                Explore
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard/profile" className="w-8 h-8 bg-neutral-800 hover:bg-neutral-700 rounded-full flex items-center justify-center border border-neutral-700 select-none transition-colors">
                  <span className="text-sm">👤</span>
                </Link>
                <form action={handleLogout}>
                  <button type="submit" className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="text-neutral-300 hover:text-white px-4 py-2 rounded-lg transition-colors">
                  Log In
                </Link>
                <Link href="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
