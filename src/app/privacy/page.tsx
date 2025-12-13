'use client';

import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>

        <div className="flex flex-col gap-4 text-neutral-600 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          <section>
            <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              1. Information We Collect
            </h2>
            <p>
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Account information (email address, name)</li>
              <li>Habit and commitment data you create</li>
              <li>Completion records and progress tracking</li>
              <li>Group membership and interactions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              2. How We Use Your Information
            </h2>
            <p>
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze trends and usage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              3. Information Sharing
            </h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>With service providers who assist in operating our service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              4. Data Security
            </h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              5. Your Rights
            </h2>
            <p>
              You have the right to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              6. Cookies and Tracking
            </h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          <section>
            <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              7. Children's Privacy
            </h2>
            <p>
              Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              8. Changes to This Policy
            </h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              9. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us.
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

