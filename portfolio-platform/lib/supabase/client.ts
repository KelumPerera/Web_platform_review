import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Ensure these are only used client-side or in safe server environments
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
