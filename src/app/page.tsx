'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { CodeVerificationScreen } from '@/components/auth/CodeVerificationScreen';
import { PasswordSetupScreen } from '@/components/auth/PasswordSetupScreen';

type Step = 'email' | 'code' | 'password';

export default function Home() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { sendMagicCode, verifyMagicCode, createAccount, checkUserExists, user } = useAuthContext();

  // Redirect if already logged in - but only if we're not in the account creation flow
  useEffect(() => {
    // Don't redirect if we're in the middle of creating an account (password step)
    // Only redirect if user is logged in and we're not in account creation flow
    if (user && step !== 'password' && step !== 'code') {
      router.push('/check-in');
    }
  }, [user, router, step]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    // Check if user already exists
    try {
      const exists = await checkUserExists(email);
      if (exists) {
        setError('An account with this email already exists. Please sign in instead.');
        setTimeout(() => {
          router.push('/sign-in');
        }, 2000);
        return;
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }

    setError('');
    setIsLoading(true);
    try {
      console.log('Attempting to send magic code to:', email);
      await sendMagicCode(email);
      console.log('Magic code sent, moving to code verification step');
      setStep('code');
    } catch (error: any) {
      console.error('Error in handleEmailSubmit:', error);
      const errorMessage = error?.message || 'Failed to send verification code. Please try again.';
      setError(errorMessage);
      console.error('Error message shown to user:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeVerify = async (code: string) => {
    setIsLoading(true);
    try {
      console.log('Verifying code for:', email);
      
      // CRITICAL: Set step to password BEFORE verification
      // This prevents the redirect useEffect from triggering when user state updates
      setStep('password');
      
      await verifyMagicCode(email, code);
      console.log('✓ Code verification successful');
      
      // Wait briefly for auth state to sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (user) {
        console.log('✓ User authenticated, ready for password setup');
      } else {
        console.log('⚠ User state not synced yet, but code verification was successful');
        console.log('Proceeding to password setup - user is authenticated at API level');
      }
      
      // Step is already set to 'password' above
      // This ensures we show the password screen even if user state syncs immediately
    } catch (error: any) {
      console.error('Code verification error:', error);
      // If verification fails, go back to code step
      setStep('code');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSetup = async (password: string, name?: string) => {
    setIsLoading(true);
    try {
      console.log('Setting up password for:', email);
      await createAccount(email, password, name);
      
      console.log('Account creation completed, waiting for user state...');
      
      // Wait for account to be saved and user state to update
      let attempts = 0;
      const maxAttempts = 40; // Increased wait time
      
      while (!user && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
        if (attempts % 5 === 0) {
          console.log(`Waiting for user state... attempt ${attempts}/${maxAttempts}`);
        }
      }
      
      // Verify account was created by checking if user exists
      console.log('Verifying account was created...');
      try {
        const accountExists = await checkUserExists(email);
        console.log('Account verification result:', accountExists);
        if (!accountExists) {
          console.error('WARNING: Account was not found after creation!');
          console.error('This might mean the transaction did not complete. Please try signing in in a few moments.');
          // Don't throw, but log the warning
        } else {
          console.log('✓ Account verified successfully in database');
        }
      } catch (verifyError) {
        console.error('Error verifying account:', verifyError);
        // Don't throw here, let the redirect happen
      }
      
      // Account created, user should be authenticated now
      if (user) {
        console.log('User authenticated, redirecting to check-in');
        router.push('/check-in');
      } else {
        // Even if user state hasn't updated, try redirecting
        // The ProtectedRoute will handle authentication check
        console.warn('User state not updated after account creation, but attempting redirect');
        // Give it one more moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.push('/check-in');
      }
    } catch (error: any) {
      console.error('Password setup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'code') {
    return (
      <CodeVerificationScreen
        email={email}
        onVerify={handleCodeVerify}
        onBack={() => {
          setStep('email');
          setError('');
        }}
      />
    );
  }

  if (step === 'password') {
    return (
      <PasswordSetupScreen
        email={email}
        onSetPassword={handlePasswordSetup}
        onBack={() => {
          setStep('code');
          setError('');
        }}
      />
    );
  }

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Enter your email to get started"
      footerLink={{
        text: "Already have an account?",
        linkText: "Sign in",
        href: "/sign-in",
      }}
    >
      <form onSubmit={handleEmailSubmit} className="w-full flex flex-col gap-4">
        <Input
          type="email"
          placeholder="email@domain.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
          required
          className="h-12"
        />
        
        {error && (
          <p className="text-red-600 text-sm text-center">{error}</p>
        )}

        <Button 
          type="submit" 
          variant="primary" 
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Continue'}
        </Button>
      </form>
    </AuthLayout>
  );
}

