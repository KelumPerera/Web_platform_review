import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import SocialShare from '@/app/components/SocialShare';

export const revalidate = 60;

export default async function ExplorePage({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string; tab?: string }>;
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const resolvedParams = await searchParams;
  const query = resolvedParams?.query || '';
  const activeTab = resolvedParams?.tab || 'products'; // Default to products for review

  // 1. Fetch Profiles
  let profilesQuery = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (query) {
    profilesQuery = profilesQuery.or(`username.ilike.%${query}%,full_name.ilike.%${query}%`);
  }
  const { data: profiles } = await profilesQuery;

  // 2. Fetch Reviewable Products
  let productsQuery = supabase
    .from('portfolio_items')
    .select(`
      *,
      profiles (
        username,
        full_name
      ),
      review_reports (
        rating
      )
    `)
    .eq('is_product', true)
    .order('created_at', { ascending: false });

  if (query) {
    productsQuery = productsQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%,tags.ilike.%${query}%`);
  }
  const { data: rawProducts } = await productsQuery;

  const products = (rawProducts || []).map(p => {
    const ratings = p.review_reports?.map((r: any) => r.rating) || [];
    const avgRating = ratings.length > 0 ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1) : null;
    return {
      ...p,
      avgRating,
      reviewCount: ratings.length
    };
  });

  return (
    <div className="max-w-[95vw] mx-auto py-8 px-4 md:px-12">
      {/* Hero Header */}
      <div className="text-center mb-10">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-500">Explore Platform</span>
        <h1 className="text-4xl font-extrabold tracking-tight text-white mt-2 mb-4">Discover & Verify Products</h1>
        <p className="text-neutral-400 max-w-2xl mx-auto text-sm">
          Browse through reviewable applications built by developers, run validation test cases, and leave reviews.
        </p>

        {/* Search */}
        <div className="mt-8 max-w-md mx-auto">
          <form className="relative">
            <input type="hidden" name="tab" value={activeTab} />
            <input
              type="text"
              name="query"
              placeholder={activeTab === 'products' ? 'Search products, tags, categories...' : 'Search creators...'}
              defaultValue={query}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-4 pr-24 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-white transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-10">
        <div className="bg-neutral-900/60 p-1 rounded-xl border border-neutral-800/80 flex">
          <Link
            href={`/explore?tab=products${query ? `&query=${query}` : ''}`}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'products' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Reviewable Products
          </Link>
          <Link
            href={`/explore?tab=creators${query ? `&query=${query}` : ''}`}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'creators' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Creators Profiles
          </Link>
        </div>
      </div>

      {/* Grid Rendering */}
      {activeTab === 'products' ? (
        products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {products.map((item) => {
              const profile = item.profiles;
              const productUrl = typeof window !== 'undefined' ? `${window.location.origin}/${profile?.username}` : `https://portfolio-platform.dev/${profile?.username}`;
              
              return (
                <div
                  key={item.id}
                  className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/80 rounded-2xl overflow-hidden shadow-2xl hover:border-neutral-700/60 transition-all flex flex-col group"
                >
                  <div className="relative h-44 bg-neutral-950 flex items-center justify-center border-b border-neutral-800/80 overflow-hidden">
                    <img
                      src={item.media_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                    {item.category && (
                      <span className="absolute top-3 left-3 bg-neutral-900/90 text-neutral-300 border border-neutral-800 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                        📁 {item.category}
                      </span>
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <Link href={`/${profile?.username}`} className="hover:underline">
                          <h3 className="text-lg font-bold text-white leading-snug">{item.title}</h3>
                        </Link>
                        {item.avgRating && (
                          <div className="flex items-center text-amber-400 text-xs font-bold whitespace-nowrap bg-amber-500/10 px-2 py-0.5 rounded">
                            ★ {item.avgRating}
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-neutral-400 font-medium mb-3">By {profile?.full_name}</p>
                      
                      <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed mb-4">
                        {item.description || 'No description provided.'}
                      </p>

                      {item.tags && (
                        <div className="flex flex-wrap gap-1.5 mb-6">
                          {item.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean).slice(0, 3).map((tag: string) => (
                            <span key={tag} className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      {/* Social Share & External Links */}
                      <div className="pt-4 border-t border-neutral-800/85 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-neutral-500 font-semibold">{item.reviewCount} reviews submitted</span>
                          <SocialShare
                            url={productUrl}
                            title={`${item.title} on Portfolio Platform`}
                            description={`Check out ${item.title} by ${profile?.full_name} on Portfolio Platform.`}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {item.demo_url && (
                            <a
                              href={item.demo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded-xl text-xs font-semibold transition-all active:scale-98"
                            >
                              Live Demo
                            </a>
                          )}
                          <Link
                            href={`/${profile?.username}`}
                            className="bg-neutral-850 hover:bg-neutral-850/80 text-white text-center py-2 rounded-xl text-xs font-semibold transition-all active:scale-98 border border-neutral-800"
                          >
                            Review App
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-neutral-900/50 border border-neutral-800 rounded-2xl shadow-2xl max-w-md mx-auto">
            <span className="text-4xl">🔍</span>
            <h2 className="text-xl font-semibold text-neutral-200 mt-4 mb-2">No Products Found</h2>
            <p className="text-xs text-neutral-400 px-4">
              {query ? `Try refining your search terms for "${query}"` : 'No reviewable products are currently registered.'}
            </p>
          </div>
        )
      ) : (
        profiles && profiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {profiles.map((profile) => (
              <Link
                key={profile.id}
                href={`/${profile.username}`}
                className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/80 rounded-2xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all group flex flex-col justify-between"
              >
                <div className="h-28 bg-gradient-to-r from-neutral-800/40 to-neutral-900/40 flex items-center justify-center">
                  <div className="w-16 h-16 bg-neutral-850 rounded-full flex items-center justify-center text-2xl border-4 border-neutral-900 group-hover:border-blue-500 transition-colors">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      '👤'
                    )}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1 leading-snug">{profile.full_name}</h3>
                    <p className="text-xs text-neutral-500 mb-3">@{profile.username}</p>
                    {profile.bio && (
                      <p className="text-neutral-400 text-xs line-clamp-2 leading-relaxed">{profile.bio}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-neutral-900/50 border border-neutral-800 rounded-2xl shadow-2xl max-w-md mx-auto">
            <span className="text-4xl">🔍</span>
            <h2 className="text-xl font-semibold text-neutral-200 mt-4 mb-2">No Profiles Found</h2>
            <p className="text-xs text-neutral-400 px-4">
              {query ? `Try refining your search terms for "${query}"` : 'Be the first creator to register a profile!'}
            </p>
          </div>
        )
      )}
    </div>
  );
}
