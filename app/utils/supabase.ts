import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function getSupabaseServerClient() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;

  if (accessToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    });
  }

  return supabase;
}

export async function getSessionUser() {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}
