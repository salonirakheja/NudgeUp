'use client';

import { useCommitments } from '@/contexts/CommitmentsContext';
import { useMemo } from 'react';

export const StreakStatsCards = () => {
  const { commitments, completions, getCompletionPercentageForDate } = useCommitments();

  // Calculate current perfect day streak (consecutive days from today backwards where all daily commitments were completed)
  const currentStreak = useMemo(() => {
    const dailyCommitments = commitments.filter(c => !c.frequencyType || c.frequencyType === 'daily');
    
    if (dailyCommitments.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let currentDate = new Date(today);
    
    // Check backwards from today
    while (true) {
      // Format date as YYYY-MM-DD
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Check if all daily commitments that existed on this date were completed
      const commitmentsForDate = dailyCommitments.filter((commitment) => {
        const [createdYear, createdMonth, createdDay] = commitment.createdAt.split('T')[0].split('-').map(Number);
        const createdDate = new Date(createdYear, createdMonth - 1, createdDay);
        createdDate.setHours(0, 0, 0, 0);
        return createdDate <= currentDate;
      });
      
      if (commitmentsForDate.length === 0) {
        // No commitments existed on this date, break the streak
        break;
      }
      
      // Check if all commitments for this date were completed
      const allCompleted = commitmentsForDate.every((commitment) => {
        const completion = completions.find(
          c => c.commitmentId === commitment.id && c.date === dateStr && c.completed
        );
        return completion?.completed || false;
      });
      
      if (allCompleted) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
        currentDate.setHours(0, 0, 0, 0);
      } else {
        break;
      }
    }
    
    return streak;
  }, [commitments, completions]);

  // Calculate longest perfect day streak (longest consecutive period in history where all daily commitments were completed)
  const longestStreak = useMemo(() => {
    const dailyCommitments = commitments.filter(c => !c.frequencyType || c.frequencyType === 'daily');
    
    if (dailyCommitments.length === 0) return 0;
    
    // Find the earliest date (when the first commitment was created)
    const earliestDate = dailyCommitments.reduce((earliest, commitment) => {
      const [year, month, day] = commitment.createdAt.split('T')[0].split('-').map(Number);
      const createdDate = new Date(year, month - 1, day);
      return createdDate < earliest ? createdDate : earliest;
    }, new Date());
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let longestStreak = 0;
    let currentStreak = 0;
    let currentDate = new Date(earliestDate);
    currentDate.setHours(0, 0, 0, 0);
    
    // Iterate through all dates from earliest to today
    while (currentDate <= today) {
      // Format date as YYYY-MM-DD
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Check if all daily commitments that existed on this date were completed
      const commitmentsForDate = dailyCommitments.filter((commitment) => {
        const [createdYear, createdMonth, createdDay] = commitment.createdAt.split('T')[0].split('-').map(Number);
        const createdDate = new Date(createdYear, createdMonth - 1, createdDay);
        createdDate.setHours(0, 0, 0, 0);
        return createdDate <= currentDate;
      });
      
      if (commitmentsForDate.length > 0) {
        // Check if all commitments for this date were completed
        const allCompleted = commitmentsForDate.every((commitment) => {
          const completion = completions.find(
            c => c.commitmentId === commitment.id && c.date === dateStr && c.completed
          );
          return completion?.completed || false;
        });
        
        if (allCompleted) {
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          currentStreak = 0; // Reset streak
        }
      } else {
        // No commitments existed on this date, reset streak
        currentStreak = 0;
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
    }
    
    return longestStreak;
  }, [commitments, completions]);

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
          {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
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
          {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
        </div>
      </div>
    </div>
  );
};

