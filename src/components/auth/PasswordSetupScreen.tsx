'use client';

import { useState } from 'react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface PasswordSetupScreenProps {
  email: string;
  onSetPassword: (password: string, name?: string) => Promise<void>;
  onBack: () => void;
}

export function PasswordSetupScreen({ email, onSetPassword, onBack }: PasswordSetupScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState(email.split('@')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await onSetPassword(password, name);
    } catch (error: any) {
      setError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] min-h-screen relative bg-white mx-auto">
      <div className="px-6 pt-10 pb-8 flex flex-col items-center">
        <div className="mb-6">
          <Logo />
        </div>
        <div className="w-full flex flex-col items-center gap-4">
          <h1 className="text-neutral-700 text-[18px] font-semibold leading-[24px] text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
            Create your password
          </h1>
          <p className="text-neutral-500 text-[14px] font-normal leading-[20px] text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
            Choose a secure password for your account
          </p>
          
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 mt-2">
            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
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

            <Input
              type="password"
              placeholder="Confirm password"
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
              disabled={isLoading || !password || !confirmPassword}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <button
            onClick={onBack}
            className="text-sm text-neutral-500 hover:text-neutral-700 mt-2"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}

