import { cookies } from 'next/headers';
import { create } from 'zustand';
import { supabase } from '@/lib/supabase'; // Using the route handler client here for simplicity

interface AuthState {
  user: any | null;
  profile: any | null;
  isLoading: boolean;
  setUser: (user: any | null) => void;
  setProfile: (profile: any | null) => void;
  fetchUserAndProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  fetchUserAndProfile: async () => {
    try {
      set({ isLoading: true });
      const { data: { user } } = await supabase.auth.getUser();
      set({ user });

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        set({ profile });
      } else {
        set({ profile: null });
      }
    } catch (error) {
      console.error('Error fetching user and profile:', error);
      set({ user: null, profile: null }); // Clear data on error
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
    // Optionally redirect to login page here or let the component handle it
  },
}));
