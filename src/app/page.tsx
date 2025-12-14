'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { CodeVerificationScreen } from '@/components/auth/CodeVerificationScreen';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAccount, setCheckingAccount] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCodeVerification, setShowCodeVerification] = useState(false);
  const router = useRouter();
  const { signIn, checkUserExists, verifyMagicCode, user, isLoading: authLoading } = useAuthContext();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/check-in');
    }
  }, [user, router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setCheckingAccount(true);
    try {
      const exists = await checkUserExists(email);
      if (!exists) {
        setError('No account found with this email.');
        setTimeout(() => {
          router.push('/sign-up');
        }, 1500);
        return;
      }
      // If account exists, show password field
      setShowPassword(true);
    } catch (error: any) {
      console.error('Error checking account:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setCheckingAccount(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await signIn(email, password);
      // After password verification:
      // - If refresh token exists and works: user is authenticated, no code needed
      // - If refresh token doesn't exist or fails: magic code is sent, show verification screen
      // Check if user is authenticated (refresh token worked)
      let attempts = 0;
      while (!user && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 300));
        attempts++;
      }
      
      if (user) {
        // User authenticated via refresh token - redirect to check-in
        router.push('/check-in');
      } else {
        // Refresh token didn't work or doesn't exist - show code verification
        setShowCodeVerification(true);
      }
    } catch (error: any) {
      console.error('Error signing in:', error);
      // If error mentions magic code, show code verification screen
      if (error.message && (error.message.includes('magic code') || error.message.includes('code'))) {
        setShowCodeVerification(true);
      } else {
        setError(error.message || 'Incorrect password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeVerify = async (code: string) => {
    setIsLoading(true);
    try {
      await verifyMagicCode(email, code);
      // Wait for authentication
      let attempts = 0;
      while (!user && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      if (user) {
        router.push('/check-in');
      } else {
        throw new Error('Authentication failed. Please try again.');
      }
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  if (showCodeVerification) {
    return (
      <CodeVerificationScreen
        email={email}
        onVerify={handleCodeVerify}
        onBack={() => {
          setShowCodeVerification(false);
          setError('');
        }}
      />
    );
  }

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Welcome back! Enter your email to continue."
      illustrationSize={200}
      footerLink={{
        text: "Don't have an account?",
        linkText: "Create one",
        href: "/sign-up",
      }}
    >
      <form 
        onSubmit={showPassword ? handlePasswordSubmit : handleEmailSubmit} 
        className="w-full flex flex-col gap-4"
      >
        <Input
          type="email"
          placeholder="email@domain.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
            setShowPassword(false);
          }}
          required
          className="h-12"
          disabled={showPassword}
        />
        
        {showPassword && (
          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            required
            className="h-12"
            autoFocus
          />
        )}

        {error && (
          <p className="text-red-600 text-sm text-center">{error}</p>
        )}

        <Button 
          type="submit" 
          variant="primary" 
          disabled={isLoading || checkingAccount}
        >
          {checkingAccount ? 'Checking...' : isLoading ? 'Signing in...' : showPassword ? 'Sign in' : 'Continue'}
        </Button>

        {showPassword && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setShowPassword(false);
                setPassword('');
                setError('');
              }}
              className="text-sm text-neutral-500 hover:text-neutral-700 text-center"
            >
              Use a different email
            </button>
            <button
              type="button"
              onClick={() => router.push('/forgot-password')}
              className="text-sm text-primary-600 hover:text-primary-700 text-center"
            >
              Forgot password?
            </button>
          </div>
        )}
      </form>
    </AuthLayout>
  );
}
