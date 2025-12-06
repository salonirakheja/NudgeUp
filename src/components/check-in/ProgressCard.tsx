'use client';

import { Commitment } from '@/types';
import { useCommitments } from '@/contexts/CommitmentsContext';

interface ProgressCardProps {
  completed: number;
  total: number;
  commitments?: Commitment[]; // Optional: to calculate average streak
}

function ProgressCard({ completed, total, commitments = [] }: ProgressCardProps) {
  const { getWeeklyCompletionCount } = useCommitments();
  
  // Separate daily and weekly habits
  const dailyHabits = commitments.filter(c => !c.frequencyType || c.frequencyType === 'daily');
  const weeklyHabits = commitments.filter(c => c.frequencyType === 'weekly');
  
  // Only count daily habits for today's progress
  const dailyCompleted = dailyHabits.filter(c => c.completed).length;
  const dailyTotal = dailyHabits.length;
  const dailyPercent = dailyTotal > 0 ? (dailyCompleted / dailyTotal) * 100 : 0;
  
  // Calculate weekly habits completion - show actual progress percentage
  // For each weekly habit, calculate: (completed count / timesPerWeek) * 100
  // Then average across all weekly habits
  let totalWeeklyProgress = 0;
  weeklyHabits.forEach(habit => {
    const count = getWeeklyCompletionCount(habit.id);
    const timesPerWeek = habit.timesPerWeek || 3;
    const habitProgress = Math.min((count / timesPerWeek) * 100, 100); // Cap at 100%
    totalWeeklyProgress += habitProgress;
  });
  const weeklyTotal = weeklyHabits.length;
  const weeklyPercent = weeklyTotal > 0 ? totalWeeklyProgress / weeklyTotal : 0;
  
  // Count how many weekly habits have met their goal (for display text)
  const weeklyCompleted = weeklyHabits.filter(habit => {
    const count = getWeeklyCompletionCount(habit.id);
    return count >= (habit.timesPerWeek || 3);
  }).length;
  
  // Calculate average streak or use the highest streak (only for daily habits)
  const averageStreak = dailyHabits.length > 0
    ? Math.round(dailyHabits.reduce((sum, c) => sum + c.streak, 0) / dailyHabits.length)
    : 0;
  const maxStreak = dailyHabits.length > 0
    ? Math.max(...dailyHabits.map(c => c.streak), 0)
    : 0;
  const displayStreak = maxStreak > 0 ? maxStreak : averageStreak;

  // Determine microtext based on completion status
  const getMicrotext = () => {
    if (dailyTotal === 0 && weeklyTotal === 0) return "Start your journey 🚀";
    if (dailyCompleted === dailyTotal && dailyTotal > 0) {
      return "All daily commitments completed today 🙌";
    }
    if (dailyCompleted > 0) {
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
        {/* Microtext */}
        <div className="text-neutral-500 text-[13px] font-medium leading-[18px] mt-0.5 whitespace-nowrap" style={{ fontFamily: 'Inter, sans-serif' }}>
          {getMicrotext()}
        </div>
      </div>

      {/* Progress sections - Daily and Weekly */}
      <div className="flex flex-col gap-4 mt-2">
        {/* Daily Progress */}
        {dailyTotal > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-neutral-500 text-[12px] font-normal leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Daily progress:
            </span>
            <div className="text-neutral-500 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Daily commitment: {dailyCompleted}/{dailyTotal} completed
            </div>
            <div className="w-full bg-neutral-100 rounded-full overflow-hidden" style={{ height: '16px' }}>
              <div 
                className="bg-success-400 rounded-full transition-all duration-300"
                style={{ width: `${dailyPercent}%`, height: '16px' }}
              />
            </div>
          </div>
        )}
        
        {/* Weekly Progress */}
        {weeklyTotal > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-neutral-500 text-[12px] font-normal leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Weekly progress:
            </span>
            <div className="text-neutral-500 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              {Math.round(weeklyPercent)}% completed this week
            </div>
      <div className="w-full bg-neutral-100 rounded-full overflow-hidden" style={{ height: '16px' }}>
        <div 
          className="bg-success-400 rounded-full transition-all duration-300"
                style={{ width: `${weeklyPercent}%`, height: '16px' }}
        />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { ProgressCard };
