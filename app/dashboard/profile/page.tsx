import { redirect } from 'next/navigation';
import MediaUploader from '@/app/components/MediaUploader';
import { getSupabaseServerClient } from '@/app/utils/supabase';

async function updateProfile(formData: FormData) {
  'use server';
  
  const supabase = await getSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const username = formData.get('username') as string;
  const fullName = formData.get('fullName') as string;
  const bio = formData.get('bio') as string;
  const avatarUrl = formData.get('avatarUrl') as string;

  if (!username || !fullName) {
    redirect('/dashboard/profile?error=Missing required fields');
  }

  // Check if username already exists (excluding current user)
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', user.id)
    .single();

  if (existingProfile) {
    redirect('/dashboard/profile?error=Username already taken');
  }

  // Check if user already has a profile
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (existingUser) {
    // Update existing profile
    const { error } = await supabase
      .from('profiles')
      .update({
        username,
        full_name: fullName,
        bio,
        avatar_url: avatarUrl,
      })
      .eq('id', user.id);

    if (error) {
      redirect(`/dashboard/profile?error=${encodeURIComponent(error.message)}`);
    }
  } else {
    // Create new profile
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username,
        full_name: fullName,
        bio,
        avatar_url: avatarUrl,
      });

    if (error) {
      redirect(`/dashboard/profile?error=${encodeURIComponent(error.message)}`);
    }
  }

  redirect('/dashboard/profile');
}

export default async function ProfilePage() {
  const supabase = await getSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const handleAvatarUpload = (url: string, fileName: string) => {
    // This would be handled in a real app by storing the URL in state
    console.log('Avatar uploaded:', url);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-white mb-8">Profile</h1>
      
      {profile ? (
        <div className="space-y-6">
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/50">
            <h2 className="text-xl font-bold mb-6 text-white">Edit Profile</h2>
            
            <form action={updateProfile} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold tracking-wide text-neutral-400 uppercase mb-2">Username</label>
                <input 
                  type="text" 
                  name="username"
                  defaultValue={profile.username}
                  required
                  minLength={3}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold tracking-wide text-neutral-400 uppercase mb-2">Full Name</label>
                <input 
                  type="text" 
                  name="fullName"
                  defaultValue={profile.full_name}
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold tracking-wide text-neutral-400 uppercase mb-2">Bio</label>
                <textarea 
                  name="bio"
                  rows={4}
                  defaultValue={profile.bio || ''}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold tracking-wide text-neutral-400 uppercase mb-2">Avatar URL</label>
                <input 
                  type="url" 
                  name="avatarUrl"
                  defaultValue={profile.avatar_url || ''}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all text-sm"
                />
              </div>
              
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 font-semibold text-sm rounded-xl px-6 py-3 shadow-lg shadow-blue-500/10 active:scale-98 transition-all text-white"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/50">
          <h2 className="text-xl font-semibold mb-6">Create Your Profile</h2>
          
          <form action={updateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input 
                type="text" 
                name="username"
                required
                minLength={3}
                placeholder="johndoe"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input 
                type="text" 
                name="fullName"
                required
                placeholder="John Doe"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea 
                name="bio"
                rows={4}
                placeholder="Tell us about yourself..."
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Create Profile
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
