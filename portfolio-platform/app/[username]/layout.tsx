import { getSupabaseServerClient } from '@/lib/supabase/server';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = getSupabaseServerClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, bio, avatar_url')
    .eq('username', username)
    .single();

  if (!profile) {
    return {
      title: 'Portfolio Not Found',
      description: 'This portfolio does not exist',
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
    twitter: {
      card: 'summary_large_image',
      title: profile.full_name,
      description: profile.bio || `${profile.full_name}'s portfolio`,
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
  };
}

export { default } from './page';
