'use client';

import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="w-full max-w-[440px] min-h-screen relative bg-white mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-neutral-500 text-[14px] font-normal hover:text-neutral-700"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          ← Back
        </button>
        <Logo />
        <div className="w-12" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-6">
        <h1 className="text-neutral-700 text-[24px] font-semibold leading-[32px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          Terms of Service
        </h1>

        <div className="flex flex-col gap-4 text-neutral-600 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          <section>
            <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using NudgeUp, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              2. Use License
            </h2>
            <p>
              Permission is granted to temporarily use NudgeUp for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>Attempt to reverse engineer any software contained in NudgeUp</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section>
            <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              3. User Account
            </h2>
            <p>
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              4. User Content
            </h2>
            <p>
              You retain ownership of any content you submit to NudgeUp. By submitting content, you grant us a license to use, modify, and display that content in connection with the service.
            </p>
          </section>

          <section>
            <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              5. Disclaimer
            </h2>
            <p>
              The materials on NudgeUp are provided on an 'as is' basis. NudgeUp makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              6. Limitations
            </h2>
            <p>
              In no event shall NudgeUp or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use NudgeUp.
            </p>
          </section>

          <section>
            <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              7. Revisions
            </h2>
            <p>
              NudgeUp may revise these terms of service at any time without notice. By using this service you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              8. Contact Information
            </h2>
            <p>
              If you have any questions about these Terms of Service, please contact us.
            </p>
          </section>
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-200">
          <p className="text-neutral-400 text-[12px] font-normal" style={{ fontFamily: 'Inter, sans-serif' }}>
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

