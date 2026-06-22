import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
  );
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
          Showcase Your <span className="text-blue-500">Portfolio</span>
        </h1>
        <p className="text-xl text-neutral-400 max-w-2xl mx-auto mb-10">
          Create your custom portfolio page with dynamic social features. 
          Share your work, collect likes, and connect with the community.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/signup"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg transition-colors"
          >
            Get Started
          </Link>
          <Link 
            href="/explore"
            className="px-8 py-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-semibold text-lg transition-colors"
          >
            Explore Portfolios
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-neutral-900 py-12 border-y border-neutral-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-500 mb-2">500+</div>
              <div className="text-neutral-400">Active Portfolios</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-500 mb-2">10K+</div>
              <div className="text-neutral-400">Total Likes</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-500 mb-2">2K+</div>
              <div className="text-neutral-400">Comments</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-500 mb-2">100+</div>
              <div className="text-neutral-400">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Portfolios */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold">Featured Portfolios</h2>
          <Link href="/explore" className="text-blue-500 hover:text-blue-400 font-semibold">
            View All &rarr;
          </Link>
        </div>

        {profiles && profiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <Link
                key={profile.id}
                href={`/${profile.username}`}
                className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all group"
              >
                <div className="h-32 bg-gradient-to-r from-neutral-800 to-neutral-900 flex items-center justify-center">
                  <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center text-3xl border-4 border-neutral-900 group-hover:border-blue-500 transition-colors">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      '👤'
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1">{profile.full_name}</h3>
                  <p className="text-neutral-500 mb-3">@{profile.username}</p>
                  {profile.bio && (
                    <p className="text-neutral-400 text-sm line-clamp-2">{profile.bio}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-neutral-400">No portfolios yet. Be the first to create one!</p>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="bg-neutral-900 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Why Create a Portfolio?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-neutral-950 p-8 rounded-xl border border-neutral-800">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-2xl mb-6">
                📱
              </div>
              <h3 className="text-xl font-bold mb-3">Custom URLs</h3>
              <p className="text-neutral-400">Get your own unique subpath like platform.com/username. Perfect for sharing on social media and business cards.</p>
            </div>
            
            <div className="bg-neutral-950 p-8 rounded-xl border border-neutral-800">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-2xl mb-6">
                ❤️
              </div>
              <h3 className="text-xl font-bold mb-3">Social Features</h3>
              <p className="text-neutral-400">Engage with your audience through likes, comments, and social sharing. Build your community today.</p>
            </div>
            
            <div className="bg-neutral-950 p-8 rounded-xl border border-neutral-800">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-2xl mb-6">
                🚀
              </div>
              <h3 className="text-xl font-bold mb-3">Fast & Secure</h3>
              <p className="text-neutral-400">Built with Next.js for lightning-fast performance and Supabase for secure, real-time data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to Showcase Your Work?</h2>
        <p className="text-xl text-neutral-400 mb-10 max-w-2xl mx-auto">
          Join thousands of creators who are already using our platform to build their personal brand.
        </p>
        <Link 
          href="/signup"
          className="inline-block px-10 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-xl transition-colors"
        >
          Create Your Portfolio Now
        </Link>
      </section>
    </div>
  );
}
