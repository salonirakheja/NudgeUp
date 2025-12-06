'use client';

import { useEffect, useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { CommitmentsProvider } from '@/contexts/CommitmentsContext';
import { GroupsProvider } from '@/contexts/GroupsContext';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // During SSR, render children without providers to avoid InstantDB hooks being called
  if (!isMounted) {
    return <>{children}</>;
  }

  // On client side, render with all providers
  return (
    <AuthProvider>
      <CommitmentsProvider>
        <GroupsProvider>
          {children}
        </GroupsProvider>
      </CommitmentsProvider>
    </AuthProvider>
  );
}

