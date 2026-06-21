import React from 'react';
import DashboardLayout from './layout';
import ProfileForm from './profile/page'; // Assuming ProfileForm is the default export from page.tsx
import { supabaseServer } from '@/lib/supabase/serverComponentClient'; // Use server component client for Server Components
import { cookies } from 'next/headers';

export default async function DashboardProfilePage() {
  const cookieStore = cookies();
  const supabase = supabaseServer(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to login if not authenticated (though AuthProvider should handle this client-side)
    // This is a safeguard for direct access or server-side rendering issues.
    return <div>Redirecting to login...</div>; // Or use Next.js redirect function
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error("Error fetching profile for dashboard:", error);
    // Handle error display appropriately
    return <div className="text-red-500">Error loading profile data.</div>;
  }

  return (
    <DashboardLayout>
      <ProfileForm initialProfile={profile} userId={user.id} />
    </DashboardLayout>
  );
}
