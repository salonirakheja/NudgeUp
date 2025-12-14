'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { CodeVerificationScreen } from '@/components/auth/CodeVerificationScreen';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCodeVerification, setShowCodeVerification] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword, verifyMagicCode } = useAuthContext();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
      setShowCodeVerification(true);
    }
  }, [searchParams]);

  const handleCodeVerify = async (verificationCode: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Verify the code - this will authenticate the user
      await verifyMagicCode(email, verificationCode);
      setCode(verificationCode);
      setShowCodeVerification(false);
      setShowPasswordForm(true);
    } catch (error: any) {
      console.error('Error verifying code:', error);
      setError(error.message || 'Invalid code. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!code) {
      setError('Please verify your code first');
      return;
    }

    setError('');
    setIsLoading(true);
    
    try {
      await resetPassword(email, code, newPassword);
      
      // Success - redirect to sign in
      router.push('/?message=Password reset successfully. Please sign in.');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showCodeVerification) {
    return (
      <CodeVerificationScreen
        email={email}
        onVerify={handleCodeVerify}
        onBack={() => router.push('/forgot-password')}
      />
    );
  }

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Enter your new password below."
      illustrationSize={200}
      footerLink={{
        text: "Remember your password?",
        linkText: "Sign in",
        href: "/",
      }}
    >
      <form onSubmit={handlePasswordReset} className="w-full flex flex-col gap-4">
        <Input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setError('');
          }}
          required
          className="h-12"
          autoFocus
          minLength={6}
        />

        <Input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
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
          {isLoading ? 'Resetting password...' : 'Reset password'}
        </Button>
      </form>
    </AuthLayout>
  );
}

