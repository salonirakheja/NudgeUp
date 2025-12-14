'use client';

import { useState } from 'react';
import { Commitment } from '@/types';
import { useCommitments } from '@/contexts/CommitmentsContext';

interface Member {
  id: string;
  name: string;
  avatar: string;
  completedToday: boolean;
  streak: number;
  commitmentCompletions?: { [commitmentId: string]: boolean };
}

interface HabitTrackerProps {
  habit: Commitment;
  members: Member[];
}

export const HabitTracker = ({ habit, members }: HabitTrackerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { getCompletionForDate } = useCommitments();
  const today = new Date().toISOString().split('T')[0];

  // Get completion status for current user
  const getMemberCommitmentCompletion = (memberId: string) => {
    if (memberId === '3' || memberId === 'current-user') {
      return getCompletionForDate(habit.id, today);
    }
    return members.find(m => m.id === memberId)?.commitmentCompletions?.[habit.id] || false;
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-neutral-50 rounded-xl flex items-center justify-center">
            <span className="text-base">{habit.icon}</span>
          </div>
          <h4 className="text-neutral-700 text-[18px] font-semibold leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            {habit.name} Tracker
          </h4>
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-10 h-10 bg-neutral-50 rounded-full flex justify-center items-center"
        >
          {isExpanded ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12.5L10 7.5L15 12.5" stroke="#4A5568" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 7.5L10 12.5L15 7.5" stroke="#4A5568" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>

      {/* Tracker Table */}
      {isExpanded && (
        <div className="flex flex-col gap-3">
          {/* Table Header */}
          <div className="px-2 pb-2 border-b border-neutral-50 flex items-center gap-4">
            <div className="flex-1">
              <span className="text-neutral-400 text-[13px] font-medium leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                Members
              </span>
            </div>
            <div className="w-16 text-center">
              <span className="text-neutral-400 text-[13px] font-medium leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                Today
              </span>
            </div>
            <div className="w-16 text-right">
              <span className="text-neutral-400 text-[13px] font-medium leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                Streak
              </span>
            </div>
          </div>

          {/* Member Rows */}
          {members.map((member) => {
            const isCompleted = getMemberCommitmentCompletion(member.id);
            // Get streak for this specific commitment (in real app, would come from API)
            const commitmentStreak = member.commitmentCompletions?.[`${habit.id}_streak`] || member.streak;
            
            return (
              <div 
                key={member.id} 
                className="px-2 py-2 rounded-2xl flex items-center gap-9"
              >
                {/* Member Info */}
                <div className="flex-1 flex items-center gap-3">
                  <div className="w-8 h-8 bg-neutral-50 rounded-full flex justify-center items-center">
                    {member.avatar && (member.avatar.startsWith('data:') || member.avatar.startsWith('http')) ? (
                      <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                    <span className="text-neutral-950 text-[16px] font-normal leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {member.avatar || '😊'}
                    </span>
                    )}
                  </div>
                  <span className="text-neutral-700 text-[16px] font-normal leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {member.name}
                  </span>
                </div>

                {/* Today Status for this habit */}
                <div className="w-6 h-6 flex justify-center items-center">
                  {isCompleted ? (
                    <div className="w-6 h-6 bg-success-400 rounded-full flex justify-center items-center">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.5 7L6 9.5L10.5 5" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-neutral-200 rounded-full flex justify-center items-center">
                      <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full"></div>
                    </div>
                  )}
                </div>

                {/* Streak for this habit */}
                <div className="w-16 flex justify-end items-center gap-1">
                  <img 
                    src="/icons/Check-In Page/Icon-4.svg" 
                    alt="Streak" 
                    className="w-4 h-4"
                  />
                  <span className="text-neutral-700 text-[16px] font-normal leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {commitmentStreak}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

