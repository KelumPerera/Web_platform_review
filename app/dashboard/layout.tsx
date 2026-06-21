import { getSupabaseServerClient } from '@/app/utils/supabase';
import Link from 'next/link';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username')
    .eq('id', user?.id)
    .single();

  const navItems = [
    { name: 'Profile', href: '/dashboard/profile' },
    { name: 'Portfolio Items', href: '/dashboard/items' },
    { name: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex">
      <aside className="w-64 bg-neutral-900 border-r border-neutral-800 p-6 hidden md:block flex-shrink-0">
        <h1 className="text-2xl font-bold mb-8 text-blue-500">Portfolio Platform</h1>
        
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-3 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="mt-8 pt-8 border-t border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center border border-neutral-700">
              <span className="text-lg">👤</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-neutral-200">
                {profile?.full_name || user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                {profile?.username ? `@${profile.username}` : 'Creator'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
