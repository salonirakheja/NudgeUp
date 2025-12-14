'use client';

import { init } from '@instantdb/react';
import { useState } from 'react';

// Get your app ID from environment variable or use the provided one
const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID || 'fcf2fc96-851a-48c3-837f-bdea0ad2b107';

if (!APP_ID) {
  console.error('NEXT_PUBLIC_INSTANT_APP_ID is not set');
}

// Only initialize InstantDB on the client side
let db: ReturnType<typeof init> | null = null;

if (typeof window !== 'undefined') {
  const envAppId = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
  if (process.env.NODE_ENV === 'development') {
    console.log('InstantDB Configuration:', {
      hasEnvVar: !!envAppId,
      usingEnvVar: !!envAppId,
      usingFallback: !envAppId,
      appId: APP_ID ? `${APP_ID.substring(0, 8)}...` : 'Missing',
      environment: process.env.NODE_ENV || 'unknown',
    });
  }
  db = init({ appId: APP_ID });
}

// Define your schema
export type Schema = {
  users: {
    id: string;
    email: string;
    name: string;
    password?: string; // Hashed password
    avatar?: string;
    avatarImage?: string;
    createdAt: number;
  };
  commitments: {
    id: string;
    userId: string;
    name: string;
    icon: string;
    streak: number;
    completed: boolean;
    createdAt: number;
    duration?: number;
    groupId?: string;
  };
  completions: {
    id: string;
    commitmentId: string;
    userId: string;
    date: string;
    completed: boolean;
  };
  groups: {
    id: string;
    name: string;
    icon: string;
    description?: string;
    totalDays?: number;
    inviteCode?: string;
    createdAt: number;
  };
  groupMembers: {
    id: string;
    groupId: string;
    userId: string;
    completedToday: boolean;
    streak: number;
    memberSince: number;
  };
  nudges: {
    id: string;
    toUserId: string;
    fromUserId: string;
    habitId: string;
    groupId: string;
    createdAt: number;
    resolvedAt?: number | null;
  };
};

// Export db and individual exports separately for Turbopack compatibility
// Note: db will be null during SSR, but hooks will handle this
export { db };

// Export individual items
// For hooks, we need to create wrapper functions that check if db exists
export const auth = db?.auth || ({} as any);

// Export hooks - these will only be called on client side (ClientProviders ensures this)
// Return safe defaults if db is not initialized (shouldn't happen, but be defensive)
export function useQuery(query: any) {
  if (!db) {
    // Return safe defaults - this should never happen if ClientProviders is working correctly
    const [data] = useState(null);
    const [isLoading] = useState(true);
    return { data, isLoading };
  }
  return db.useQuery(query);
}

export function useAuth() {
  if (!db) {
    // Return safe defaults - this should never happen if ClientProviders is working correctly
    const [user] = useState(null);
    const [isLoading] = useState(true);
    return { user, isLoading };
  }
  return db.useAuth();
}

export const tx = db?.tx || ({} as any);
export const id = () => crypto.randomUUID();
export const queryOnce = db?.queryOnce || (async (query: any) => {
  console.warn('queryOnce called but db is not initialized');
  return null;
});

// Note: auth.signInWithToken maps to signInWithCustomToken internally

