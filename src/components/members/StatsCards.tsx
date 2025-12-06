'use client';

interface Member {
  currentStreak: number;
  longestStreak: number;
  activeHabits: number;
  todayCompleted: number;
  todayTotal: number;
}

interface StatsCardsProps {
  member: Member;
}

export const StatsCards = ({ member }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Current Streak */}
      <div className="bg-white rounded-2xl shadow-md p-4 border border-neutral-100">
        <div className="mb-2">
          <img 
            src="/icons/Member profile/Icon-1.svg" 
            alt="Flame" 
            className="w-5 h-5"
          />
        </div>
        <div className="text-red-600 text-[13px] font-medium leading-[18px] mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          Current Streak
        </div>
        <div className="text-neutral-700 text-[16px] font-normal leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          {member.currentStreak} days
        </div>
      </div>

      {/* Longest Streak */}
      <div className="bg-white rounded-2xl shadow-md p-4 border border-neutral-100">
        <div className="mb-2">
          <img 
            src="/icons/Member profile/Icon-2.svg" 
            alt="Trophy" 
            className="w-5 h-5"
          />
        </div>
        <div className="text-primary-700 text-[13px] font-medium leading-[18px] mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          Longest Streak
        </div>
        <div className="text-neutral-700 text-[16px] font-normal leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          {member.longestStreak} days
        </div>
      </div>

      {/* Active Habits */}
      <div className="bg-white rounded-2xl shadow-md p-4 border border-neutral-100">
        <div className="mb-2">
          <img 
            src="/icons/Member profile/Icon-3.svg" 
            alt="Habits" 
            className="w-5 h-5"
          />
        </div>
        <div className="text-blue-900 text-[13px] font-medium leading-[18px] mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          Active Habits
        </div>
        <div className="text-neutral-700 text-[16px] font-normal leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          {member.activeHabits} habits
        </div>
      </div>

      {/* Today */}
      <div className="bg-white rounded-2xl shadow-md p-4 border border-neutral-100">
        <div className="mb-2">
          <img 
            src="/icons/Member profile/Icon-4.svg" 
            alt="Today" 
            className="w-5 h-5"
          />
        </div>
        <div className="text-yellow-700 text-[13px] font-medium leading-[18px] mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          Today
        </div>
        <div className="text-neutral-700 text-[16px] font-normal leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          {member.todayCompleted}/{member.todayTotal} done
        </div>
      </div>
    </div>
  );
};

