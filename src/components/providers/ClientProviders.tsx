'use client';

import { useEffect, useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { CommitmentsProvider } from '@/contexts/CommitmentsContext';
import { GroupsProvider } from '@/contexts/GroupsContext';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  // Always render providers - they will handle SSR/CSR differences internally
  // This ensures that useAuthContext and other hooks are always available
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

