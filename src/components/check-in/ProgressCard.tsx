'use client';

import { Commitment } from '@/types';

interface ProgressCardProps {
  completed: number;
  total: number;
  commitments?: Commitment[]; // Optional: to calculate average streak
}

function ProgressCard({ completed, total, commitments = [] }: ProgressCardProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  
  // Calculate average streak or use the highest streak
  const averageStreak = commitments.length > 0
    ? Math.round(commitments.reduce((sum, c) => sum + c.streak, 0) / commitments.length)
    : 0;
  const maxStreak = commitments.length > 0
    ? Math.max(...commitments.map(c => c.streak))
    : 0;
  const displayStreak = maxStreak > 0 ? maxStreak : averageStreak;

  // Determine microtext based on completion status
  const getMicrotext = () => {
    if (total === 0) return "Start your journey 🚀";
    if (completed === total) {
      if (completed === 0) return "Ready to begin? 💪";
      return "All commitments completed today 🙌";
    }
    if (completed > 0) {
      return "You're on track today 🙌";
    }
    return "Let's get started! 💪";
  };

  return (
    <div className="w-full px-6 py-5 rounded-2xl border border-neutral-100 flex flex-col relative" style={{ backgroundColor: '#F5F7E8', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)', gap: '12px' }}>
      {/* Streak display - Top right */}
      {displayStreak > 0 && (
        <div className="absolute top-5 right-6 px-3 py-1 bg-neutral-50 rounded-full whitespace-nowrap flex-shrink-0 flex items-center" style={{ height: '24px' }}>
          <span className="text-neutral-600 text-[13px] font-medium leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            {displayStreak}-day perfect streak
          </span>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[18px] font-semibold leading-[24px]" style={{ fontFamily: 'Inter, sans-serif', color: '#374151' }}>
          Today's Progress
        </h2>
        {/* Subtitle - Slightly smaller */}
        <div className="flex items-center gap-2">
          <span className="text-neutral-500 text-[15px] font-normal leading-[22px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            {completed}
          </span>
          <span className="text-neutral-500 text-[15px] font-normal leading-[22px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            / {total} commitments
          </span>
        </div>
        {/* Microtext */}
        <div className="text-neutral-500 text-[13px] font-medium leading-[18px] mt-0.5 whitespace-nowrap" style={{ fontFamily: 'Inter, sans-serif' }}>
          {getMicrotext()}
        </div>
      </div>

      {/* Progress bar - Thicker and reduced spacing above */}
      <div className="w-full bg-neutral-100 rounded-full overflow-hidden" style={{ height: '16px' }}>
        <div 
          className="bg-success-400 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%`, height: '16px' }}
        />
      </div>
    </div>
  );
}

export { ProgressCard };
