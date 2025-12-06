'use client';

import { useRouter } from 'next/navigation';

export const NotificationsCard = () => {
  const router = useRouter();

  const handleNotifications = () => {
    router.push('/profile/notifications');
  };

  return (
    <button
      onClick={handleNotifications}
      className="w-full h-20 bg-white rounded-2xl shadow-md border-2 border-neutral-50 p-4 flex items-center gap-3 hover:shadow-lg transition-shadow"
    >
      {/* Icon */}
      <div className="w-10 h-10 bg-neutral-50 rounded-full flex justify-center items-center flex-shrink-0">
        <img 
          src="/icons/Profile/Icon-7.svg" 
          alt="Notifications" 
          className="w-5 h-5"
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-start gap-1">
        <span className="text-neutral-700 text-[16px] font-normal leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          Notifications
        </span>
        <span className="text-neutral-500 text-[13px] font-medium leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          Manage reminders and alerts
        </span>
      </div>
    </button>
  );
};

