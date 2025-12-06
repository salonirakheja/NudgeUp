'use client';

import { useState } from 'react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CodeVerificationScreenProps {
  email: string;
  onVerify: (code: string) => Promise<void>;
  onBack: () => void;
}

export function CodeVerificationScreen({ email, onVerify, onBack }: CodeVerificationScreenProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || code.length < 4) {
      setError('Please enter the verification code');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await onVerify(code);
    } catch (error: any) {
      setError(error.message || 'Invalid code. Please try again.');
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
            Verify your email
          </h1>
          <p className="text-neutral-500 text-[14px] font-normal leading-[20px] text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
            We sent a verification code to <strong className="text-neutral-700">{email}</strong>
          </p>
          <p className="text-neutral-400 text-[13px] font-normal leading-[18px] text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
            Enter the code below to continue
          </p>
          
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 mt-2">
            <Input
              type="text"
              placeholder="Enter verification code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              required
              className="h-12 text-center text-lg tracking-widest"
              maxLength={6}
              autoFocus
            />

            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            <Button 
              type="submit" 
              variant="primary" 
              disabled={isLoading || code.length < 4}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </form>

          <button
            onClick={onBack}
            className="text-sm text-neutral-500 hover:text-neutral-700 mt-2"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Use a different email
          </button>
        </div>
      </div>
    </div>
  );
}

