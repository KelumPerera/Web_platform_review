import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return Response.json({ authenticated: false }, { status: 401 });
  }

  return Response.json({ authenticated: true, user });
}
