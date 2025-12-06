'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // During SSR, just show loading - providers aren't available yet
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-neutral-500 text-[16px] font-normal" style={{ fontFamily: 'Inter, sans-serif' }}>
          Loading...
        </div>
      </div>
    );
  }

  // On client side, use the actual ProtectedRouteContent component
  return <ProtectedRouteContent>{children}</ProtectedRouteContent>;
}

// Separate component that uses the auth context - only rendered on client
function ProtectedRouteContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-neutral-500 text-[16px] font-normal" style={{ fontFamily: 'Inter, sans-serif' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

export { ProtectedRoute };

