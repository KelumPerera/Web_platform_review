import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import PortfolioClient from './portfolio-client';
import SocialShare from '@/app/components/SocialShare';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function PortfolioPage({ params }: PageProps) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
  );
  const { username } = await params;

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
      comments(*),
      project_changelogs(*),
      review_reports(
        *,
        review_upvotes(id),
        review_comments(*)
      )
    `)
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false });

  const structuralItems = (items || []).map(item => ({
    ...item,
    like_count: item.likes?.length || 0,
    comments_list: item.comments || [],
    project_changelogs: item.project_changelogs || [],
    reviews: (item.review_reports || []).map((r: any) => ({
      ...r,
      upvote_count: r.review_upvotes?.length || 0,
      comments: r.review_comments || []
    }))
  }));

  const pageUrl = `https://localhost:3000/${username}`;
  const pageTitle = `${profile.full_name}'s Portfolio`;
  const pageDescription = profile.bio || `Check out ${profile.full_name}'s portfolio`;

  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": {
      "@type": "Person",
      "name": profile.full_name,
      "alternateName": profile.username,
      "description": profile.bio || "",
      "image": profile.avatar_url || undefined,
      "url": pageUrl
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />
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
        
        <div className="pt-6 border-t border-neutral-800">
          <SocialShare url={pageUrl} title={pageTitle} description={pageDescription} />
        </div>
      </header>

      <section className="max-w-6xl mx-auto">
        <PortfolioClient initialItems={structuralItems} />
      </section>
    </main>
  );
}
