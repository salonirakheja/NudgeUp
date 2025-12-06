'use client';

import { Logo } from '@/components/ui/Logo';

interface EmailConfirmationScreenProps {
  email: string;
  onBack: () => void;
}

export function EmailConfirmationScreen({ email, onBack }: EmailConfirmationScreenProps) {
  return (
    <div className="w-full max-w-[440px] min-h-screen relative bg-white mx-auto">
      <div className="px-6 pt-10 pb-8 flex flex-col items-center">
        <div className="mb-6">
          <Logo />
        </div>
        <div className="w-full flex flex-col items-center gap-4 text-center">
          <h1 className="text-neutral-700 text-[18px] font-semibold leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Check your email
          </h1>
          <p className="text-neutral-500 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            We sent a magic link to <strong className="text-neutral-700">{email}</strong>
          </p>
          <p className="text-neutral-400 text-[13px] font-normal leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Click the link in the email to sign in. You can close this window.
          </p>
          <button
            onClick={onBack}
            className="text-[14px] font-medium mt-4 hover:underline"
            style={{ fontFamily: 'Inter, sans-serif', color: '#A6B41F' }}
          >
            Use a different email
          </button>
        </div>
      </div>
    </div>
  );
}

