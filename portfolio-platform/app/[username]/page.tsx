import { getSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PortfolioClient from './portfolio-client';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function PortfolioPage({ params }: PageProps) {
  const { username } = await params;
  const supabase = getSupabaseServerClient();

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (profileErr || !profile) {
    notFound();
  }

  const { data: items } = await supabase
    .from('portfolio_items')
    .select(`
      *,
      likes(id),
      comments(*)
    `)
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false });

  const structuralItems = (items || []).map(item => ({
    ...item,
    like_count: item.likes?.length || 0,
    comments_list: item.comments || []
  }));

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-12">
      <header className="max-w-4xl mx-auto text-center mb-16 space-y-4">
        {profile.avatar_url && (
          <img 
            src={profile.avatar_url} 
            alt={profile.full_name} 
            className="w-24 h-24 rounded-full mx-auto object-cover border border-neutral-800"
          />
        )}
        <h1 className="text-4xl font-extrabold tracking-tight">{profile.full_name}</h1>
        <p className="text-neutral-400 max-w-md mx-auto">@{profile.username}</p>
        {profile.bio && <p className="text-neutral-300 max-w-xl mx-auto">{profile.bio}</p>}
      </header>

      <section className="max-w-6xl mx-auto">
        <PortfolioClient initialItems={structuralItems} />
      </section>
    </main>
  );
}
