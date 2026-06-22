import React from 'react';
import Image from 'next/image';

// Premium 404 Not Found page – no Supabase client initialization
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-800 text-white">
      <div className="text-center p-8 max-w-lg">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl mb-6">
          Oops! The page you’re looking for doesn’t exist.
        </p>
        <Image
          src="/favicon.ico"
          alt="Company logo"
          width={120}
          height={120}
          className="mx-auto opacity-80"
        />
        <p className="mt-6 text-sm">
          You might have mistyped the URL or the page may have moved.
        </p>
        <a
          href="/"
          className="inline-block mt-8 rounded-md bg-white bg-opacity-20 px-6 py-3 text-lg font-medium transition hover:bg-opacity-30"
        >
          Return Home
        </a>
      </div>
    </main>
  );
}
