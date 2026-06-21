import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseServerClient } from '@/app/utils/supabase';

export default async function ItemsPage() {
  const supabase = await getSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: items } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false });

  const deleteItem = async (formData: FormData) => {
    'use server';
    const supabase = await getSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect('/login');
    }

    const id = formData.get('id') as string;

    const { data: item } = await supabase
      .from('portfolio_items')
      .select('profile_id, media_url')
      .eq('id', id)
      .single();

    if (!item || item.profile_id !== user.id) {
      redirect('/dashboard/items');
    }

    if (item.media_url) {
      const fileName = item.media_url.split('/').pop();
      if (fileName) {
        const filePath = `${user.id}/${fileName}`;
        await supabase.storage.from('portfolio-media').remove([filePath]);
      }
    }

    await supabase.from('portfolio_items').delete().eq('id', id);
    redirect('/dashboard/items');
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Portfolio Items</h1>
        <Link 
          href="/dashboard/items/add"
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          + Add New Item
        </Link>
      </div>

      {items && items.length > 0 ? (
        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="w-16 h-16 bg-neutral-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">{item.media_type === 'image' ? '🖼️' : '🎥'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{item.title}</h3>
                <p className="text-sm text-neutral-400 truncate">{item.description}</p>
                <p className="text-xs text-neutral-500 mt-1">{item.media_type === 'image' ? 'Image' : 'Video'}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link 
                  href={`/dashboard/items/${item.id}`}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm transition-colors"
                >
                  Edit
                </Link>
                <form action={deleteItem} className="flex-shrink-0">
                  <input type="hidden" name="id" value={item.id} />
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-neutral-900 p-12 rounded-xl border border-neutral-800 text-center">
          <div className="w-24 h-24 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🖼️</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">No Portfolio Items Yet</h2>
          <p className="text-neutral-400 mb-6">Start building your portfolio by adding your first project.</p>
          <Link 
            href="/dashboard/items/add"
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Add Your First Item
          </Link>
        </div>
      )}
    </div>
  );
}
