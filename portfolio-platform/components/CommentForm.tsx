'use client';

import { useState } from 'react';

interface CommentFormProps {
  itemId: string;
  onCommentAdded?: () => void;
}

export default function CommentForm({ itemId, onCommentAdded }: CommentFormProps) {
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);

    try {
      await fetch('/api/interactions/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          authorName,
          content
        })
      });

      setContent('');
      onCommentAdded?.();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 pt-4 border-t border-neutral-800">
      <div className="flex gap-2">
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Your name (optional)"
          className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-600"
          maxLength={50}
        />
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment..."
        className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-600"
        rows={2}
        maxLength={500}
      />
      <button
        type="submit"
        disabled={isSubmitting || !content.trim()}
        className="w-full bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 disabled:text-neutral-500 text-sm px-4 py-2 rounded transition-colors"
      >
        {isSubmitting ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  );
}
