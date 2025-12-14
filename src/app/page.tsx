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
  const [showCodeVerification, setShowCodeVerification] = useState(false);
  const router = useRouter();
  const { signIn, verifyMagicCode, user } = useAuthContext();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/check-in');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setError('');
    setIsLoading(true);
    
    try {
      await signIn(email, password);
      
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
        // Refresh token didn't work - magic code was sent, show verification screen
        setShowCodeVerification(true);
      }
    } catch (error: any) {
      // Check if magic code is required
      if (error.message === 'MAGIC_CODE_REQUIRED') {
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
      subtitle="Welcome back! Enter your email and password to continue."
      illustrationSize={200}
      footerLink={{
        text: "Don't have an account?",
        linkText: "Create one",
        href: "/sign-up",
      }}
    >
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
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
        />

        {error && (
          <p className="text-red-600 text-sm text-center">{error}</p>
        )}

        <Button 
          type="submit" 
          variant="primary" 
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>

        <button
          type="button"
          onClick={() => router.push('/forgot-password')}
          className="text-sm text-primary-600 hover:text-primary-700 text-center"
        >
          Forgot password?
        </button>
      </form>
    </AuthLayout>
  );
}
