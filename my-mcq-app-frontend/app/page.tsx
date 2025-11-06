// app/page.tsx

"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Always attempt to go to the dashboard.
    // The Layout component will handle redirecting to /auth if the user is not logged in.
    router.push('/dashboard');
  }, [router]);

  // Render a loading state while the redirect happens.
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <p className="text-lg text-gray-900 dark:text-white">Loading...</p>
    </div>
  );
}