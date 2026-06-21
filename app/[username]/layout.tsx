import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, bio, avatar_url')
    .eq('username', username)
    .single();

  if (!profile) {
    return {
      title: 'Portfolio Not Found',
    };
  }

  return {
    title: `${profile.full_name} | Portfolio`,
    description: profile.bio || `Check out ${profile.full_name}'s portfolio`,
    openGraph: {
      title: profile.full_name,
      description: profile.bio || `${profile.full_name}'s portfolio`,
      images: profile.avatar_url ? [{ url: profile.avatar_url }] : [],
    },
  };
}

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
