'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function EmailSettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState('alex.johnson@email.com');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    // TODO: Implement actual save logic
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
    router.back();
  };

  return (
    <div className="w-full max-w-[440px] min-h-[956px] relative bg-white mx-auto pb-20">
      {/* Header */}
      <div className="px-6 pt-12 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-neutral-50 rounded-full flex justify-center items-center"
        >
          <img 
            src="/icons/Profile/Icon-10.svg" 
            alt="Back" 
            className="w-5 h-5"
          />
        </button>
        <h1 className="text-neutral-700 text-xl font-medium leading-8" style={{ fontFamily: 'Inter, sans-serif' }}>
          Email Settings
        </h1>
      </div>

      {/* Content */}
      <div className="px-6 pt-8 flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-neutral-700 text-base font-normal leading-6 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <Button
              onClick={handleSave}
              variant="primary"
              className="w-full"
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

