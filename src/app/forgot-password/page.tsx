'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthLayout } from '@/components/auth/AuthLayout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { sendPasswordResetCode, checkUserExists } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setIsLoading(true);
    
    try {
      // Check if user exists first
      const exists = await checkUserExists(email);
      if (!exists) {
        setError('No account found with this email address.');
        return;
      }

      // Send password reset code
      await sendPasswordResetCode(email);
      setSuccess(true);
      
      // Redirect to reset password page after a short delay
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (error: any) {
      console.error('Error sending password reset code:', error);
      setError(error.message || 'Failed to send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email address and we'll send you a code to reset your password."
      illustrationSize={200}
      footerLink={{
        text: "Remember your password?",
        linkText: "Sign in",
        href: "/",
      }}
    >
      {success ? (
        <div className="w-full flex flex-col gap-4">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <p className="text-primary-700 text-sm text-center">
              Password reset code sent! Check your email and we'll redirect you to reset your password.
            </p>
          </div>
        </div>
      ) : (
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
            autoFocus
          />

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <Button 
            type="submit" 
            variant="primary" 
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send reset code'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

