'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { usePathname, useRouter } from 'next/navigation';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { fetchUserAndProfile, isLoading, user, profile } = useAuthStore();

  useEffect(() => {
    fetchUserAndProfile();
  }, [fetchUserAndProfile]);

  useEffect(() => {
    if (!isLoading && user && !profile?.username && pathname !== '/onboarding' && pathname !== '/login') {
      // If user is logged in but has no username and is not on onboarding/login page
      router.push('/onboarding');
    } else if (!isLoading && !user && pathname !== '/login' && !pathname.startsWith('/api')) {
      // If user is not logged in and not on login page or API route
      router.push('/login');
    }
    // Handle cases where user is logged in and has username, should proceed normally
    // Handle cases where user is not logged in and is on login page, should proceed normally
  }, [isLoading, user, profile, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100">
        Loading authentication...
      </div>
    );
  }

  return <>{children}</>;
}
