'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  illustrationSize?: number;
  children: ReactNode;
  footerLink?: {
    text: string;
    linkText: string;
    href: string;
  };
  showTerms?: boolean;
}

export function AuthLayout({
  title,
  subtitle,
  illustrationSize = 200,
  children,
  footerLink,
  showTerms = true,
}: AuthLayoutProps) {
  return (
    <div className="w-full max-w-[440px] min-h-screen relative bg-white mx-auto">
      <div className="px-6 pt-10 pb-8 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-6">
          <Logo />
        </div>

        {/* Bear Illustration */}
        <div className="mb-6 rounded-[4px] overflow-hidden">
          <Image
            src="/icons/bear.png"
            alt="Bear illustration"
            width={illustrationSize}
            height={illustrationSize}
            className="object-contain"
            priority
          />
        </div>

        {/* Heading Section */}
        <div className="w-full flex flex-col items-center gap-2 mb-6">
          <h1 className="text-center text-neutral-700 text-[18px] font-semibold leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            {title}
          </h1>
          <p className="text-center text-neutral-500 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            {subtitle}
          </p>
        </div>

        {/* Form Content */}
        <div className="w-full">
          {children}
        </div>

        {/* Footer Links - tightened spacing (12-16px from button) */}
        {footerLink && (
          <div className="w-full text-center mt-4">
            <span className="text-neutral-500 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              {footerLink.text}{' '}
            </span>
            <Link href={footerLink.href} className="text-[#A6B41F] text-[14px] font-medium leading-[20px] hover:underline" style={{ fontFamily: 'Inter, sans-serif' }}>
              {footerLink.linkText}
            </Link>
          </div>
        )}

        {/* Terms and Privacy Policy - tightened spacing (12-16px from button/link) */}
        {showTerms && (
          <div className="w-full text-center mt-3">
            <span className="text-neutral-400 text-[11px] font-normal leading-[14px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              By continuing, you agree to our{' '}
            </span>
            <Link href="/terms" className="text-neutral-400 text-[11px] font-normal leading-[14px] hover:underline" style={{ fontFamily: 'Inter, sans-serif' }}>
              Terms
            </Link>
            <span className="text-neutral-400 text-[11px] font-normal leading-[14px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              {' '}and{' '}
            </span>
            <Link href="/privacy" className="text-neutral-400 text-[11px] font-normal leading-[14px] hover:underline" style={{ fontFamily: 'Inter, sans-serif' }}>
              Privacy
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

