'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth, auth, useQuery, tx, id, queryOnce } from '@/lib/instant';
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
      console.log('Sign in attempt for:', normalizedEmail);

      const userExists = await checkUserExists(normalizedEmail);
      console.log('User exists (strict check):', userExists);

      if (!userExists) {
        throw new Error('No account found with this email. Please create an account first.');
      }

      // Wait a moment for usersData to be available if it's still loading
      let attempts = 0;
      while (!usersData?.users && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }

      const user = usersData?.users?.find(
        (u: any) => u.email?.toLowerCase()?.trim() === normalizedEmail
      );
      console.log('Found user in database:', !!user);
      console.log('User has password:', !!user?.password);

      if (!user) {
        // At this point we KNOW the user should exist from checkUserExists,
        // so if we still can't see them, treat it as an error and do not silently fall back.
        throw new Error('Could not load your account details. Please try again in a moment or use magic code login.');
      }

      if (!user.password) {
        throw new Error('Account not set up properly. Please create a new account.');
      }

      console.log('Hashing provided password...');
      const hashedPassword = await hashPassword(password);
      const userPassword = (user.password as unknown as string) || '';
      console.log('Password hash comparison:', {
        storedHash: userPassword?.substring(0, 20) + '...',
        computedHash: hashedPassword?.substring(0, 20) + '...',
        match: userPassword === hashedPassword,
      });

      if (userPassword !== hashedPassword) {
        console.error('Password mismatch:', {
          storedLength: userPassword?.length,
          computedLength: hashedPassword?.length,
        });
        throw new Error('Incorrect password. Please try again.');
      }

      console.log('Password verified successfully');
      
      // Password verified - try to use stored refresh token for password-only sign-in
      // This allows users to sign in with just password after initial account creation
      const storedRefreshToken = typeof window !== 'undefined' 
        ? localStorage.getItem(`instantdb_refresh_token_${normalizedEmail}`) 
        : null;
      
      if (storedRefreshToken && auth.signInWithToken) {
        console.log('Attempting to sign in with stored refresh token...');
        try {
          await auth.signInWithToken(storedRefreshToken);
          console.log('✓ Signed in using refresh token - no magic code needed');
          // Wait for auth state to sync
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Verify user is authenticated
          if (instantUser) {
            console.log('✓ User authenticated successfully via refresh token');
            return; // Success - user is authenticated, no magic code needed
          } else {
            console.warn('⚠ User not authenticated after refresh token, falling back to magic code');
          }
        } catch (tokenError: any) {
          console.warn('Refresh token sign-in failed (token may be expired), falling back to magic code:', tokenError);
          // Clear invalid token
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`instantdb_refresh_token_${normalizedEmail}`);
          }
          // Fall through to magic code flow
        }
      } else {
        console.log('No stored refresh token found - will use magic code authentication');
      }
      
      // If refresh token doesn't work or doesn't exist, use magic code
      // This is required by InstantDB's authentication system for first-time sign-in
      console.log('Sending magic code for InstantDB authentication...');
      await auth.sendMagicCode({ email: normalizedEmail });
      
      console.log('Magic code sent successfully');
      console.log('User will verify the code to complete sign-in');
      console.log('After verification, refresh token will be stored for future password-only sign-ins');
    } catch (error: any) {
      console.error('Error signing in:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
      });
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
      console.log('Attempting to verify magic code for:', email);
      console.log('Code received:', code);
      console.log('Auth object available:', !!auth);
      
      // Use InstantDB's SDK method - this will properly sync auth state
      if (!auth || typeof auth.signInWithMagicCode !== 'function') {
        throw new Error('Authentication service not available. Please refresh the page.');
      }
      
      console.log('Using InstantDB SDK signInWithMagicCode method...');
      console.log('This will properly sync the auth state with React.');
      
      const result = await auth.signInWithMagicCode({ 
        email: email.toLowerCase().trim(), 
        code: code.trim() 
      });
      
      console.log('✓ Magic code verified using SDK method');
      console.log('Verification result:', result);
      
      if (result?.user) {
        console.log('✓ User from verification:', { id: result.user.id, email: result.user.email });
        setVerifiedUserId(result.user.id);
        
        // Store refresh token for password-only sign-in
        if (result.user.refresh_token && result.user.email) {
          try {
            const emailKey = result.user.email.toLowerCase().trim();
            localStorage.setItem(`instantdb_refresh_token_${emailKey}`, result.user.refresh_token);
            console.log('✓ Refresh token stored for future password-only sign-ins');
          } catch (e) {
            console.warn('Could not store refresh token:', e);
          }
        }
      }
      
      // Wait for auth state to sync in React
      // The SDK method should trigger useAuth to update, but give it a moment
      console.log('Waiting for React auth state to sync...');
      await new Promise(resolve => setTimeout(resolve, 4000)); // Increased wait time to ensure auth state syncs
      
      // Check if instantUser is now available
      if (instantUser) {
        console.log('✓ User authenticated and synced in React:', { id: instantUser.id, email: instantUser.email });
      } else {
        console.log('⚠ instantUser not synced yet, but verification was successful');
        console.log('The user is authenticated - React state may sync shortly.');
      }
      
      console.log('Verification complete.');
      
    } catch (error: any) {
      console.error('Error verifying magic code:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      throw new Error(error.message || 'Invalid verification code. Please try again.');
    }
  };

  const createAccount = async (email: string, password: string, name?: string) => {
    try {
      console.log('Starting account creation for:', email);
      console.log('Current instantUser:', instantUser);
      console.log('Verified user ID from code verification:', verifiedUserId);
      console.log('Auth loading state:', authLoading);
      
      // CRITICAL: Wait for instantUser to be available before creating transaction
      // InstantDB permissions require auth.id to match the user ID in the transaction
      // auth.id is only set when instantUser is available from useAuth()
      let attempts = 0;
      const maxAttempts = 50; // Increased significantly to wait for auth state sync
      
      console.log('Waiting for InstantDB authentication state to sync...');
      console.log('This is required for transaction permissions (auth.id must match user ID)');
      while (!instantUser && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 300));
        attempts++;
        if (attempts % 5 === 0) {
          console.log(`Waiting for auth state... attempt ${attempts}/${maxAttempts}`);
        }
      }

      console.log('After waiting, instantUser:', instantUser ? { id: instantUser.id, email: instantUser.email } : 'null');
      console.log('Attempts made:', attempts);

      // CRITICAL: We MUST have instantUser available for the transaction to work
      // InstantDB's permission system checks auth.id, which is only available when instantUser exists
      if (!instantUser || !instantUser.id) {
        console.error('❌ instantUser not available after waiting. Auth state:', {
          instantUser: instantUser ? 'exists' : 'null',
          verifiedUserId,
          isLoading: authLoading,
          usersData: usersData?.users?.length || 0,
        });
        throw new Error('Authentication state not ready. Please wait a moment and try again, or go back and verify your email code again.');
      }

      const userId = instantUser.id;
      console.log('✓ Using user ID from instantUser (authenticated):', userId);

      const userExists = await checkUserExists(email);
      if (userExists) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }

      const hashedPassword = await hashPassword(password);
      const normalizedEmail = email.toLowerCase().trim();
      
      // Use instantUser.id for the transaction - this ensures auth.id matches
      const transactionUserId = userId;
      
      console.log('Creating user account:', { userId: transactionUserId, email, name });
      console.log('Password hash (first 20 chars):', hashedPassword.substring(0, 20) + '...');
      
      console.log('Attempting transaction with:', {
        transactionUserId: transactionUserId,
        instantUserStatus: instantUser ? { id: instantUser.id, email: instantUser.email } : 'null (ERROR)',
        authLoading: authLoading,
        usersDataCount: usersData?.users?.length || 0,
      });

      // CRITICAL: Give InstantDB WebSocket a moment to fully sync permissions after authentication
      // This ensures the authenticated user has write permissions before we attempt the transaction
      console.log('Giving InstantDB WebSocket a moment to fully sync permissions...');
      console.log('Using user ID for transaction:', transactionUserId);
      console.log('Auth state confirmed - instantUser available:', !!instantUser);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for permissions to sync
      
      console.log('Creating user record with ID:', transactionUserId);
      console.log('Transaction payload:', {
        id: transactionUserId,
        email: normalizedEmail,
        name: name || email.split('@')[0],
        passwordHashLength: hashedPassword.length,
        createdAt: Date.now(),
      });
      
      try {
        // Create the user record
        // InstantDB transactions are automatically sent
        console.log('Transaction will create user with:', {
          id: transactionUserId,
          email: normalizedEmail,
          name: name || email.split('@')[0],
        });
        console.log('Current auth state at transaction time:', {
          instantUser: instantUser ? { id: instantUser.id, email: instantUser.email } : 'null',
          transactionUserId,
        });
        
        // Use update() which works for both create and update in InstantDB
        // The ID must match the authenticated user's ID for permissions (users.id === auth.id)
        const userData = {
          id: transactionUserId,
          email: normalizedEmail,
          name: name || email.split('@')[0],
          password: hashedPassword,
          createdAt: Date.now(),
        };
        
        console.log('Creating transaction with data:', {
          ...userData,
          password: '[REDACTED - length: ' + hashedPassword.length + ']',
        });
        
        // Create the transaction - update() works for both new and existing records
        tx.users[transactionUserId].update(userData);
        console.log('✓ Transaction created using update()');
        
        console.log('✓ Transaction created and queued for sending');
        console.log('Transaction details logged. Waiting for sync...');
        console.log('NOTE: If this fails, check InstantDB dashboard rules to ensure authenticated users can write to users table');
        console.log('NOTE: Verify that auth.id matches transactionUserId:', transactionUserId);
      } catch (txError: any) {
        console.error('❌ Error creating transaction:', txError);
        console.error('Transaction error details:', {
          message: txError?.message,
          stack: txError?.stack,
          name: txError?.name,
        });
        throw new Error('Failed to create user record. Please try again.');
      }
      
      console.log('Waiting for transaction to sync to database (this may take a few seconds)...');
      console.log('Current authentication state:', {
        instantUser: instantUser ? { id: instantUser.id, email: instantUser.email } : 'null (but user is authenticated via code verification)',
        authLoading,
        transactionUserId,
        verifiedUserId,
      });
      
      // Wait longer for the transaction to be committed and synced
      // InstantDB transactions are automatically sent, but we need to wait for sync
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Log current database state for debugging
      console.log('Database state after wait:', {
        totalUsers: usersData?.users?.length || 0,
        userEmails: usersData?.users?.map((u: any) => u.email) || [],
      });
      
      // Verify the user was saved by checking the database
      console.log('Verifying user was saved to database...');
      let verifyAttempts = 0;
      let userSaved = false;
      const maxVerifyAttempts = 40; // Increased to give more time
      
      while (!userSaved && verifyAttempts < maxVerifyAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        verifyAttempts++;
        
        // Try to refresh the query by making a fresh queryOnce call
        if (verifyAttempts % 5 === 0) {
          try {
            console.log(`Refreshing query (attempt ${verifyAttempts})...`);
            const freshData = await queryOnce({ users: {} }) as any;
            const freshUsers = freshData?.users || [];
            console.log(`Fresh query returned ${freshUsers.length} users`);
            
            // Check in fresh data
            const savedUser = freshUsers.find((u: any) => 
              u.id === transactionUserId ||
              u.email?.toLowerCase()?.trim() === normalizedEmail
            );
            
            if (savedUser && savedUser.password) {
              userSaved = true;
              console.log('✓ User verified in fresh query with password');
              break;
            }
          } catch (queryError) {
            console.warn('Error refreshing query:', queryError);
          }
        }
        
        // Check if user exists in the database now
        // Try multiple ID variations in case there's a mismatch
        const currentInstantUserId = instantUser?.id; // May have synced by now
        const savedUser = usersData?.users?.find((u: any) => 
          u.id === transactionUserId ||
          u.id === currentInstantUserId ||
          u.email?.toLowerCase()?.trim() === normalizedEmail
        );
        
        if (savedUser && savedUser.password) {
          userSaved = true;
          console.log('✓ User verified in database with password');
          break; // Exit loop early if user is found
        }
        
        if (savedUser && !savedUser.password) {
          console.warn('⚠ User found but password field is missing');
        } else if (!savedUser && verifyAttempts % 5 === 0) {
          console.log(`Verifying user save... attempt ${verifyAttempts}/${maxVerifyAttempts}`);
          console.log('Current users in database:', usersData?.users?.length || 0);
          console.log('Looking for user with ID:', transactionUserId);
          console.log('Looking for user with email:', normalizedEmail);
        }
      }
      
      if (!userSaved) {
        console.error('❌ User was NOT saved to database after', maxVerifyAttempts, 'attempts');
        console.error('Transaction may have failed or is still syncing.');
        console.error('Expected user ID:', transactionUserId);
        console.error('Expected email:', normalizedEmail);
        console.error('Searched for IDs:', [transactionUserId, userId, verifiedUserId]);
        console.error('Current users in database:', usersData?.users?.map((u: any) => ({ id: u.id, email: u.email })) || []);
        console.error('Possible issues:');
        console.error('❌ 1. Transaction failed due to permissions (MOST LIKELY)');
        console.error('   → Check InstantDB dashboard: Rules → users table');
        console.error('   → Ensure rule allows: authenticated users can write to their own record');
        console.error('   → Rule should be: users.id === auth.id');
        console.error('❌ 2. User ID mismatch (transaction used different ID than expected)');
        console.error('❌ 3. Database sync delay (transaction may still be processing)');
        console.error('❌ 4. InstantDB authentication not fully established');
        
        // Throw an error so the user knows account creation failed
        // This is better than silently failing
        throw new Error('Account creation failed. The user record was not saved to the database. Please try again or contact support if the issue persists.');
      } else {
        console.log('✓ Account creation completed successfully - user is in database');
      }
    } catch (error: any) {
      console.error('Error creating account:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Get current user ID before signing out
      const currentUserId = localUser?.id || instantUser?.id;
      
      await auth.signOut();
      setLocalUser(null);
      
      // Clear only non-user-specific localStorage data (legacy keys)
      const keysToRemove = [
        'nudgeup_userName',
        'nudgeup_userAvatar',
        'nudgeup_userEmail',
        'userAvatar',
        'userName',
        'userAvatarImage',
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

