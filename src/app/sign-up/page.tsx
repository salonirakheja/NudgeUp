'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { CodeVerificationScreen } from '@/components/auth/CodeVerificationScreen';

type Step = 'form' | 'code';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { sendMagicCode, verifyMagicCode, createAccount, checkUserExists, user } = useAuthContext();

  // Redirect if already logged in
  useEffect(() => {
    if (user && step !== 'code') {
      router.push('/check-in');
    }
  }, [user, router, step]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setIsLoading(true);
    
    try {
      // Check if user already exists
      const exists = await checkUserExists(email);
      if (exists) {
        setError('An account with this email already exists. Please sign in instead.');
        setTimeout(() => {
          router.push('/');
        }, 2000);
        return;
      }

      // Send magic code for verification
      await sendMagicCode(email);
      setStep('code');
    } catch (error: any) {
      setError(error?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeVerify = async (code: string) => {
    setIsLoading(true);
    try {
      // Verify the code - this authenticates the user
      await verifyMagicCode(email, code);
      
      // Wait for auth state to sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create the account with password hash
      await createAccount(email, password, name || undefined);
      
      // Wait for user state to update
      let attempts = 0;
      while (!user && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      // Redirect to app
      router.push('/check-in');
    } catch (error: any) {
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
          setStep('form');
          setError('');
        }}
      />
    );
  }

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Enter your details to get started"
      footerLink={{
        text: "Already have an account?",
        linkText: "Sign in",
        href: "/",
      }}
    >
      <form onSubmit={handleFormSubmit} className="w-full flex flex-col gap-4">
        <Input
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          className="h-12"
        />
        
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
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          required
          className="h-12"
          minLength={6}
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

