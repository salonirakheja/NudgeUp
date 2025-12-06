'use client';

import { useRouter } from 'next/navigation';

export const ProfileHeader = () => {
  const router = useRouter();

  return (
    <div className="w-full relative">
      {/* Back Button */}
      <div className="absolute left-6 top-12 z-10">
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
      </div>

      {/* Title and Subtitle */}
      <div className="px-6 pt-12 flex flex-col gap-2 items-center">
        <h1 className="text-black text-[23px] font-bold leading-[32px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          Profile
        </h1>
        <p className="text-neutral-500 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          Manage your account and preferences
        </p>
      </div>
    </div>
  );
};

