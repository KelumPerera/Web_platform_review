import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // Your Supabase client
import { toast } from 'react-toastify'; // Assuming react-toastify for notifications

interface OnboardingPageProps {}

const OnboardingPage: React.FC<OnboardingPageProps> = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const usernameInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if user is logged in and has a profile, but no username
    const checkUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login'); // Not logged in, go to login
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError('Failed to load your profile. Please try again later.');
        setIsLoading(false);
        return;
      }

      if (profile?.username) {
        router.push('/dashboard'); // Username already set, redirect to dashboard
      } else {
        setIsLoading(false); // User needs to set username
      }
    };

    checkUserAndProfile();
  }, [router]);

  // Debounce username availability check
  const debounceTimer = React.useRef<NodeJS.Timeout | null>(null);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''); // Basic sanitization
    setUsername(newUsername);
    setIsAvailable(null); // Reset availability on change
    setError('');

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (newUsername.length >= 3) {
      setIsChecking(true);
      debounceTimer.current = setTimeout(async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', newUsername)
            .maybeSingle();

          if (error) {
            console.error('Error checking username:', error);
            setError('Could not check username availability. Please try again.');
            setIsAvailable(null);
          } else {
            setIsAvailable(!data?.username); // true if username is not found (available)
          }
        } catch (err) {
          console.error('Error checking username availability:', err);
          setError('An unexpected error occurred. Please try again.');
          setIsAvailable(null);
        } finally {
          setIsChecking(false);
        }
      }, 500); // 500ms debounce delay
    } else {
      setIsChecking(false);
      setIsAvailable(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || username.length < 3) {
      setError('Please enter a valid username (at least 3 characters).');
      return;
    }

    if (isChecking) {
      setError('Please wait for username availability check to complete.');
      return;
    }

    if (isAvailable === false || isAvailable === null) {
      setError('Username is not available or could not be verified. Please choose another.');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Update profile with username
      const { error } = await supabase
        .from('profiles')
        .update({ username: username })
        .eq('id', user.id);

      if (error) {
        console.error('Error setting username:', error);
        setError('Failed to set username. Please try again.');
      } else {
        toast.success('Username set successfully! Redirecting to dashboard...');
        // Force a page refresh to ensure new session data is loaded correctly
        window.location.href = '/dashboard'; 
      }
    } catch (err) {
      console.error('Error submitting username:', err);
      setError('An unexpected error occurred. Please try again later.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100 p-4">
      <div className="w-full max-w-md bg-neutral-900 rounded-lg shadow-xl p-8 border border-neutral-800">
        <h2 className="text-3xl font-bold text-center mb-6">Claim Your Username</h2>
        <p className="text-center text-neutral-400 mb-6">
          Choose a unique username that will be part of your portfolio URL.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-neutral-300">Username</label>
            <input
              ref={usernameInputRef}
              id="username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              required
              minLength={3}
              maxLength={30} // Added max length for username
              className="w-full px-4 py-3 rounded-lg bg-neutral-950 border border-neutral-800 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:ring-2 text-base"
              placeholder="your_username"
            />
            {username.length > 0 && (
              <div className="mt-2 text-sm flex items-center">
                {isChecking && <span className="animate-pulse mr-2">Checking...</span>}
                {isAvailable !== null && !isChecking && (
                  isAvailable ? (
                    <span className="text-green-400">Username available!</span>
                  ) : (
                    <span className="text-red-500">Username not available.</span>
                  )
                )}
              </div>
            )}
          </div>

          {error && <p className="text-red-500 text-center text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isChecking || !username || isAvailable === false || isAvailable === null}
            className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-lg font-semibold transition duration-150 ease-in-out"
          >
            {isChecking ? 'Verifying...' : 'Claim Username'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;
