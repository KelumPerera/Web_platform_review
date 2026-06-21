import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // Assuming you have this client configured

interface LoginPageProps {}

const LoginPage: React.FC<LoginPageProps> = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and signup
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  // Refs for form elements to reset them
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful, check for username
        const user = data.user;
        // Fetch profile to check for username
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          setError('An error occurred while fetching your profile. Please try again.');
          return;
        }
        
        if (profile?.username) {
          router.push('/dashboard'); // Redirect to dashboard if username is set
        } else {
          router.push('/onboarding'); // Redirect to onboarding if username is not set
        }
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again later.');
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Magic link sent! Please check your email to continue.');
        // Optionally clear the form
        if (emailInputRef.current) emailInputRef.current.value = '';
        setEmail('');
      } else {
        setError(data.error || 'Failed to send magic link. Please try again.');
      }
    } catch (err) {
      console.error('Magic link error:', err);
      setError('An unexpected error occurred. Please try again later.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !password || !fullName) {
      setError('Please enter email, password, and your full name.');
      return;
    }
    
    // Basic password strength check
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: fullName }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Signup successful! Please check your email to verify your account.');
        // Optionally clear the form
        if (emailInputRef.current) emailInputRef.current.value = '';
        if (passwordInputRef.current) passwordInputRef.current.value = '';
        if (nameInputRef.current) nameInputRef.current.value = '';
        setEmail('');
        setPassword('');
        setFullName('');
      } else {
        setError(data.error || 'Signup failed. Please try again.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100 p-4">
      <div className="w-full max-w-md bg-neutral-900 rounded-lg shadow-xl p-8 border border-neutral-800">
        <h2 className="text-3xl font-bold text-center mb-6">{isLogin ? 'Welcome Back!' : 'Create Your Account'}</h2>

        <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-neutral-300">Full Name</label>
              <input
                ref={nameInputRef}
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-neutral-950 border border-neutral-800 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:ring-2 text-base"
                placeholder="Your Full Name"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-300">Email Address</label>
            <input
              ref={emailInputRef}
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-neutral-950 border border-neutral-800 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:ring-2 text-base"
              placeholder="you@example.com"
            />
          </div>
          {isLogin && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-300">Password</label>
              <input
                ref={passwordInputRef}
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-neutral-950 border border-neutral-800 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:ring-2 text-base"
                placeholder="********"
              />
            </div>
          )}

          {error && <p className="text-red-500 text-center text-sm">{error}</p>}
          {message && <p className="text-green-400 text-center text-sm">{message}</p>}

          <button
            type="submit"
            className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-lg font-semibold transition duration-150 ease-in-out"
          >
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        {isLogin && (
          <button
            onClick={handleMagicLink}
            className="w-full mt-4 px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 text-lg font-semibold transition duration-150 ease-in-out"
          >
            Use Magic Link
          </button>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(''); // Clear errors on toggle
              setMessage(''); // Clear messages on toggle
            }}
            className="text-blue-500 hover:underline text-sm"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
