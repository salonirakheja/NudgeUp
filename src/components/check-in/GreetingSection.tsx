'use client';

import { useRouter } from 'next/navigation';

interface GreetingSectionProps {
  userName: string;
}

export const GreetingSection = ({ userName }: GreetingSectionProps) => {
  const router = useRouter();

  return (
    <div className="w-full flex flex-col" style={{ gap: '8px' }}>
      <div className="flex justify-between items-center">
        <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          Hello, {userName}
        </h2>
        
        {/* Calendar and Graph icons - aligned with greeting */}
        <div className="flex items-center gap-2">
          {/* Calendar icon - Standardized */}
          <button
            onClick={() => router.push('/calendar')}
            className="w-10 h-10 bg-neutral-50 rounded-full flex items-center justify-center hover:bg-neutral-100 transition-colors cursor-pointer"
            style={{ padding: '8px' }}
          >
            <img 
              src="/icons/Check-In Page/Icon-1.svg" 
              alt="Calendar" 
              className="w-5 h-5"
            />
          </button>
          
          {/* Graph/Arrow icon - Standardized */}
          <button
            onClick={() => router.push('/profile')}
            className="w-10 h-10 bg-neutral-50 rounded-full flex items-center justify-center hover:bg-neutral-100 transition-colors cursor-pointer"
            style={{ padding: '8px' }}
          >
            <img 
              src="/icons/Check-In Page/Icon-5.svg" 
              alt="Profile" 
              className="w-5 h-5"
            />
          </button>
        </div>
      </div>
      
      <p className="text-neutral-500 text-[14px] font-normal leading-[20px] pulse-animation" style={{ fontFamily: 'Inter, sans-serif' }}>
        Make progress together, one day at a time 💛
      </p>
    </div>
  );
};

