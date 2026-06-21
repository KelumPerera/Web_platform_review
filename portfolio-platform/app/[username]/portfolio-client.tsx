'use client';

import { useState } from 'react';
import CommentForm from '@/components/CommentForm';

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  media_url: string;
  media_type: 'image' | 'video';
  like_count: number;
  comments_list: Array<{ id: string; author_name: string; content: string }>;
}

export default function PortfolioClient({ initialItems }: { initialItems: PortfolioItem[] }) {
  const [items, setItems] = useState<PortfolioItem[]>(initialItems);

  const handleLike = async (itemId: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, like_count: item.like_count + 1 };
      }
      return item;
    }));

    const visitorHash = typeof window !== 'undefined' ? generateVisitorHash() : 'server-side';

    await fetch('/api/interactions/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, visitorHash })
    });
  };

  const handleCommentAdded = (itemId: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, comments_list: [...item.comments_list, { id: Date.now().toString(), author_name: 'Anonymous', content: 'New comment' }] };
      }
      return item;
    }));
  };

  const generateVisitorHash = () => {
    const userAgent = navigator.userAgent || '';
    const timestamp = new Date().toISOString();
    const combined = `${userAgent}${timestamp}`;
    
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `visitor_${Math.abs(hash).toString(36)}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {items.map((item) => (
        <article key={item.id} className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden shadow-xl">
          {item.media_type === 'video' ? (
            <video src={item.media_url} controls className="w-full h-64 object-cover" />
          ) : (
            <img src={item.media_url} alt={item.title} className="w-full h-64 object-cover" />
          )}

          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="text-sm text-neutral-400 mt-1">{item.description}</p>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-800 pt-4">
              <button 
                onClick={() => handleLike(item.id)}
                className="flex items-center space-x-2 text-sm bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-full transition-colors"
              >
                <span>❤️</span>
                <span className="font-semibold text-neutral-200">{item.like_count}</span>
              </button>
              
              <span className="text-xs text-neutral-500">
                {item.comments_list.length} comments
              </span>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto pt-2 text-xs">
              {item.comments_list.map(c => (
                <p key={c.id} className="text-neutral-400">
                  <strong className="text-neutral-200 mr-1">{c.author_name}:</strong> {c.content}
                </p>
              ))}
            </div>
            
            <CommentForm itemId={item.id} onCommentAdded={() => handleCommentAdded(item.id)} />
          </div>
        </article>
      ))}
    </div>
  );
}
