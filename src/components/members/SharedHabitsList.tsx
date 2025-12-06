'use client';

import { useCommitments } from '@/contexts/CommitmentsContext';

interface Commitment {
  id: string;
  name: string;
  icon: string;
  streak: number;
  completed: boolean;
}

interface SharedHabitsListProps {
  habits: Commitment[];
}

export const SharedHabitsList = ({ habits }: SharedHabitsListProps) => {
  const { getCommitmentStreak } = useCommitments();
  return (
    <div className="w-full flex flex-col gap-4">
      <h3 className="text-neutral-700 text-[18px] font-semibold leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
        Shared Commitments
      </h3>

      <div className="flex flex-col gap-3">
        {habits.map((habit) => (
          <div 
            key={habit.id}
            className="w-full h-20 px-4 pt-4 pb-0.5 bg-white rounded-2xl shadow-md border-2 border-neutral-50"
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="w-12 h-12 bg-success-100 rounded-2xl flex justify-center items-center">
                <span className="text-neutral-950 text-2xl font-normal leading-8 tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {habit.icon}
                </span>
              </div>

              {/* Habit Info */}
              <div className="flex-1 flex flex-col gap-1">
                <div className="text-neutral-700 text-[16px] font-normal leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {habit.name}
                </div>
                <div className="flex items-center gap-2">
                  <img 
                    src="/icons/Check-In Page/Icon-4.svg" 
                    alt="Streak" 
                    className="w-4 h-4"
                  />
                  <span className="text-neutral-500 text-[13px] font-medium leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {getCommitmentStreak(habit.id)} day streak
                  </span>
                </div>
              </div>

              {/* Checkmark */}
              {habit.completed && (
                <div className="w-6 h-6 bg-primary-500 rounded-full flex justify-center items-center">
                  <span className="text-white text-xs font-normal leading-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                    ✓
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

