'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page which is now the sign-in page
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-neutral-500 text-[16px] font-normal" style={{ fontFamily: 'Inter, sans-serif' }}>
        Redirecting...
      </div>
    </div>
  );
}
