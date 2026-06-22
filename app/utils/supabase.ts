import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Use Anon key for user authentication / client sessions, fall back to service role key if not present
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    // Return a dummy client during static generation/prerendering to prevent build failures
    return createClient(
      url || 'https://placeholder-url.supabase.co',
      key || 'placeholder-key'
    );
  }

  const supabase = createClient(url, key);

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;
    const refreshToken = cookieStore.get('sb-refresh-token')?.value;

    if (accessToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });
    }
  } catch (e) {
    // cookies() might throw an error if called in static rendering contexts where it's not supported
  }

  return supabase;
}

export async function getSessionUser() {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}
