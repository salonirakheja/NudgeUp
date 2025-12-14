'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth, auth, useQuery, tx, id, queryOnce, db } from '@/lib/instant';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  checkUserExists: (email: string) => Promise<boolean>;
  sendMagicCode: (email: string) => Promise<void>;
  verifyMagicCode: (email: string, code: string) => Promise<void>;
  createAccount: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordResetCode: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple password hashing (in production, use bcrypt or similar)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function AuthProvider({ children }: { children: ReactNode }) {
  // Always call hooks (React rules) - they will return safe defaults during SSR
  const { user: instantUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [localUser, setLocalUser] = useState<any | null>(null);
  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null);

  // Query users to check if email exists
  // Query all users - read permissions should allow this for sign-in checks
  const { data: usersData, isLoading: usersLoading } = useQuery({ users: {} });

  useEffect(() => {
    setIsLoading(authLoading);
    // If InstantDB user exists, try to find matching user in our database
    if (instantUser && usersData?.users) {
      const dbUser = usersData.users.find((u: any) => u.email === instantUser.email);
      if (dbUser) {
        setLocalUser({ ...instantUser, ...dbUser });
      } else {
        setLocalUser(instantUser);
      }
      
      // Store refresh token for password-only sign-in (keyed by email)
      if (instantUser && instantUser.refresh_token && instantUser.email) {
        try {
          const emailKey = instantUser.email.toLowerCase().trim();
          localStorage.setItem(`instantdb_refresh_token_${emailKey}`, instantUser.refresh_token);
          console.log('✓ Refresh token stored for password-only sign-in');
        } catch (e) {
          console.warn('Could not store refresh token:', e);
        }
      }
    } else {
      setLocalUser(null);
    }
  }, [authLoading, instantUser, usersData]);

  const checkUserExists = async (email: string): Promise<boolean> => {
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Checking if user exists (strict):', normalizedEmail);

    try {
      // 1) Try cached query from useQuery
      if (usersData?.users && usersData.users.length > 0) {
        const existsInCache = usersData.users.some((u: any) =>
          u.email?.toLowerCase()?.trim() === normalizedEmail
        );
        console.log('checkUserExists cache result:', existsInCache);
        if (existsInCache) return true;
      }

      // 2) Fresh query via queryOnce
      console.log('checkUserExists: making fresh queryOnce({ users: {} })');
      const freshUsersData = (await queryOnce({ users: {} })) as any;

      const users = freshUsersData?.users || [];
      console.log('checkUserExists fresh users count:', users.length);

      const existsInFresh = users.some((u: any) =>
        u.email?.toLowerCase()?.trim() === normalizedEmail
      );
      console.log('checkUserExists fresh result:', existsInFresh);

      return existsInFresh;
    } catch (error) {
      console.error('Error in checkUserExists:', error);
      // On error, be strict: we DO NOT assume the user exists.
      return false;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      // Check if user exists
      const userExists = await checkUserExists(normalizedEmail);
      if (!userExists) {
        throw new Error('No account found with this email. Please create an account first.');
      }

      // Wait for usersData to be available
      let attempts = 0;
      while (!usersData?.users && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }

      const user = usersData?.users?.find(
        (u: any) => u.email?.toLowerCase()?.trim() === normalizedEmail
      );

      if (!user) {
        throw new Error('Could not load your account details. Please try again.');
      }

      if (!user.password) {
        throw new Error('Account not set up properly. Please create a new account.');
      }

      // Verify password
      const hashedPassword = await hashPassword(password);
      const userPassword = (user.password as unknown as string) || '';

      if (userPassword !== hashedPassword) {
        throw new Error('Incorrect password. Please try again.');
      }

      // Password verified - try to use stored refresh token first
      const storedRefreshToken = typeof window !== 'undefined' 
        ? localStorage.getItem(`instantdb_refresh_token_${normalizedEmail}`) 
        : null;
      
      if (storedRefreshToken && auth.signInWithToken) {
        try {
          await auth.signInWithToken(storedRefreshToken);
          // Wait for auth state to sync
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verify user is authenticated
          if (instantUser) {
            return; // Success - user is authenticated via refresh token
          }
        } catch (tokenError: any) {
          // Token is invalid or expired - clear it and fall back to magic code
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`instantdb_refresh_token_${normalizedEmail}`);
          }
        }
      }
      
      // If no token or token failed, fall back to magic code
      // This is a rare case - user needs to verify email again
      await auth.sendMagicCode({ email: normalizedEmail });
      throw new Error('MAGIC_CODE_REQUIRED'); // Special error to signal UI to show code verification
    } catch (error: any) {
      // Re-throw the special error as-is so UI can handle it
      if (error.message === 'MAGIC_CODE_REQUIRED') {
        throw error;
      }
      throw error;
    }
  };

  const signInWithEmail = async (email: string) => {
    try {
      await auth.sendMagicCode({ email });
    } catch (error: any) {
      console.error('Error sending magic code:', error);
      throw error;
    }
  };

  const sendMagicCode = async (email: string) => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      console.log('Sending magic code to:', normalizedEmail);
      console.log('Auth object available:', !!auth);
      console.log('Auth sendMagicCode method available:', typeof auth?.sendMagicCode);
      
      if (!auth || !auth.sendMagicCode) {
        throw new Error('Authentication service is not available. Please refresh the page and try again.');
      }
      
      // Call InstantDB's sendMagicCode
      const result = await auth.sendMagicCode({ email: normalizedEmail });
      console.log('Magic code send result:', result);
      console.log('Magic code sent successfully to:', normalizedEmail);
      
      // Some implementations return a promise that resolves to undefined on success
      // Wait a moment to ensure the request completed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return result;
    } catch (error: any) {
      console.error('Error sending magic code:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        cause: error?.cause,
        toString: error?.toString(),
      });
      
      // Provide a more helpful error message based on the error type
      let errorMessage = 'Failed to send verification code. ';
      
      if (error?.message) {
        errorMessage += error.message;
      } else if (error?.toString && error.toString() !== '[object Object]') {
        errorMessage += error.toString();
      } else {
        errorMessage += 'Please check your email address and try again.';
      }
      
      throw new Error(errorMessage);
    }
  };

  const verifyMagicCode = async (email: string, code: string) => {
    try {
      if (!auth || typeof auth.signInWithMagicCode !== 'function') {
        throw new Error('Authentication service not available. Please refresh the page.');
      }
      
      const result = await auth.signInWithMagicCode({ 
        email: email.toLowerCase().trim(), 
        code: code.trim() 
      });
      
      if (result?.user) {
        setVerifiedUserId(result.user.id);
        
        // Store refresh token keyed by email
        if (result.user.refresh_token && result.user.email) {
          try {
            const emailKey = result.user.email.toLowerCase().trim();
            localStorage.setItem(`instantdb_refresh_token_${emailKey}`, result.user.refresh_token);
          } catch (e) {
            console.warn('Could not store refresh token:', e);
          }
        }
      }
      
      // Wait for auth state to sync - needed for auth.id to be set
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error: any) {
      throw new Error(error.message || 'Invalid verification code. Please try again.');
    }
  };

  const createAccount = async (email: string, password: string, name?: string) => {
    try {
      // Wait for instantUser to be available (user is authenticated via magic code verification)
      let attempts = 0;
      const maxAttempts = 30;
      
      while (!instantUser && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 300));
        attempts++;
      }

      if (!instantUser || !instantUser.id) {
        throw new Error('Authentication state not ready. Please wait a moment and try again, or go back and verify your email code again.');
      }

      const userId = instantUser.id;

      // Check if user already exists
      const userExists = await checkUserExists(email);
      if (userExists) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }

      const hashedPassword = await hashPassword(password);
      const normalizedEmail = email.toLowerCase().trim();
      
      // Wait a bit for permissions to sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!db) {
        throw new Error('Database not initialized. Please refresh the page.');
      }
      
      if (!tx || !tx.users) {
        throw new Error('Database transaction service not available. Please refresh the page.');
      }
      
      const userData = {
        id: userId,
        email: normalizedEmail,
        name: name || email.split('@')[0],
        password: hashedPassword,
        createdAt: Date.now(),
      };
      
      // Create the user record
      if (db && typeof (db as any).transact === 'function') {
        (db as any).transact(
          tx.users[userId].update(userData)
        );
      } else {
        tx.users[userId].update(userData);
      }
      
      // Wait for transaction to be sent
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error: any) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Get current user ID before signing out
      const currentUserId = localUser?.id || instantUser?.id;
      
      await auth.signOut();
      setLocalUser(null);
      
      // Clear only legacy localStorage data (keep user profile data)
      // Don't clear userName, userAvatar, userAvatarImage - these should persist
      const keysToRemove = [
        'nudgeup_userName',
        'nudgeup_userAvatar',
        'nudgeup_userEmail',
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear refresh tokens (but keep user data - it will be loaded when they sign back in)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('instantdb_refresh_token_')) {
          localStorage.removeItem(key);
        }
      });
      
      // NOTE: We do NOT clear user-specific data (nudgeup_commitments_${userId}, etc.)
      // This data should persist so users can see their data when they sign back in
      // Data is stored with userId suffix, so it's automatically isolated per user
      
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const sendPasswordResetCode = async (email: string) => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      console.log('Sending password reset code to:', normalizedEmail);

      // Check if user exists
      const userExists = await checkUserExists(normalizedEmail);
      if (!userExists) {
        throw new Error('No account found with this email address.');
      }

      // Send magic code via InstantDB (same as regular sign-in)
      // The user will use this code to verify their identity before resetting password
      await auth.sendMagicCode({ email: normalizedEmail });
      console.log('Password reset code sent successfully');
    } catch (error: any) {
      console.error('Error sending password reset code:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      // Code should already be verified by verifyMagicCode in the UI
      if (!instantUser) {
        throw new Error('Please verify your code first before resetting password.');
      }

      // Verify the authenticated user's email matches
      if (instantUser.email?.toLowerCase().trim() !== normalizedEmail) {
        throw new Error('Email mismatch. Please verify your code again.');
      }

      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);

      // Wait for usersData to be available
      let userAttempts = 0;
      while (!usersData?.users && userAttempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        userAttempts++;
      }

      // Find the user in the database
      const user = usersData?.users?.find(
        (u: any) => u.email?.toLowerCase()?.trim() === normalizedEmail
      );

      if (!user) {
        throw new Error('User not found. Please try again.');
      }

      // Update the password in the database
      if (!db) {
        throw new Error('Database not initialized');
      }

      await db.transact(
        tx.users[user.id].update({ password: hashedPassword })
      );

      // Store refresh token after password reset (user is already authenticated from code verification)
      if (instantUser.refresh_token && instantUser.email) {
        try {
          const emailKey = instantUser.email.toLowerCase().trim();
          localStorage.setItem(`instantdb_refresh_token_${emailKey}`, instantUser.refresh_token);
        } catch (e) {
          console.warn('Could not store refresh token:', e);
        }
      }
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: localUser,
        isLoading,
        signIn,
        signInWithEmail,
        checkUserExists,
        sendMagicCode,
        verifyMagicCode,
        createAccount,
        signOut,
        sendPasswordResetCode,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export { AuthProvider, useAuthContext };

