'use client';

import { useState } from 'react';

export default function SocialShare({ url, title, description }: { url: string; title: string; description: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className="flex items-center gap-3">
      {/* Web Share (Mobile Native) */}
      <button
        onClick={handleShare}
        className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white transition-all duration-300"
      >
        <span>🔗</span>
        <span>Share</span>
      </button>

      {/* Twitter/X */}
      <a
        href={twitterUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center w-9 h-9 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded-xl transition-all duration-300 text-sm"
        title="Share on Twitter"
      >
        🐦
      </a>

      {/* LinkedIn */}
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center w-9 h-9 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded-xl transition-all duration-300 text-sm"
        title="Share on LinkedIn"
      >
        💼
      </a>

      {/* Copy Link */}
      <button
        onClick={handleCopy}
        className="relative flex items-center justify-center w-9 h-9 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded-xl transition-all duration-300 text-sm text-neutral-300 hover:text-white"
        title="Copy Link"
      >
        {copied ? '✓' : '📋'}
        {copied && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] py-1 px-2 rounded border border-neutral-800 shadow-md whitespace-nowrap animate-fadeIn">
            Copied!
          </span>
        )}
      </button>
    </div>
  );
}
