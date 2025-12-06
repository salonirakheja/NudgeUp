'use client';

export const StreakStatsCards = () => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Current Streak */}
      <div className="bg-white rounded-2xl shadow-md p-4 border border-neutral-100 flex flex-col" style={{ minHeight: '100px' }}>
        <div className="mb-2">
          <img 
            src="/icons/Member profile/Icon-1.svg" 
            alt="Flame" 
            className="w-3.5 h-3.5"
          />
        </div>
        <div className="text-red-600 text-[13px] font-medium leading-[18px] mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          Current
        </div>
        <div className="text-neutral-700 text-[16px] font-normal leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          15 days
        </div>
      </div>

      {/* Longest Streak */}
      <div className="bg-white rounded-2xl shadow-md p-4 border border-neutral-100 flex flex-col" style={{ minHeight: '100px' }}>
        <div className="mb-2">
          <img 
            src="/icons/Calendar/Icon-4.svg" 
            alt="Trophy" 
            className="w-3.5 h-3.5"
          />
        </div>
        <div className="text-primary-700 text-[13px] font-medium leading-[18px] mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          Longest
        </div>
        <div className="text-neutral-700 text-[16px] font-normal leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          28 days
        </div>
      </div>
    </div>
  );
};

