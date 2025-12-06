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

interface HabitNudgesSectionProps {
  habit: Commitment;
  members: Member[];
  totalMembers: number;
}

const NudgeCard = ({ memberName, memberAvatar }: { memberName: string; memberAvatar: string }) => {
  return (
    <div className="w-full px-4 py-3 bg-white rounded-2xl shadow-sm border border-neutral-100 flex items-center gap-3">
      <div className="w-10 h-10 bg-neutral-50 rounded-full flex justify-center items-center">
        <span className="text-base">{memberAvatar}</span>
      </div>
      <div className="flex-1">
        <div className="text-neutral-700 text-[16px] font-normal leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          {memberName}
        </div>
      </div>
      <button className="px-4 py-2 bg-primary-400 rounded-xl text-black text-[13px] font-medium leading-[18px] hover:opacity-90 transition-opacity" style={{ fontFamily: 'Inter, sans-serif' }}>
        Nudge
      </button>
    </div>
  );
};

export const HabitNudgesSection = ({ habit, members, totalMembers }: HabitNudgesSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { getCompletionForDate } = useCommitments();
  const today = new Date().toISOString().split('T')[0];

  // Get members who haven't completed this specific commitment today
  const getMemberCommitmentCompletion = (memberId: string) => {
    if (memberId === '3' || memberId === 'current-user') {
      return getCompletionForDate(habit.id, today);
    }
    return members.find(m => m.id === memberId)?.commitmentCompletions?.[habit.id] || false;
  };

  const pendingMembers = members.filter(member => !getMemberCommitmentCompletion(member.id));
  const pendingCount = pendingMembers.length;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-neutral-50 rounded-xl flex items-center justify-center">
            <span className="text-base">{habit.icon}</span>
          </div>
          <h4 className="text-neutral-700 text-[18px] font-semibold leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Send Nudges for {habit.name}
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

      {/* Pending Count */}
      {pendingCount > 0 && (
        <div className="text-neutral-500 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          {pendingCount} {pendingCount === 1 ? 'member' : 'members'} haven't completed {habit.name} today
        </div>
      )}

      {/* Nudges List */}
      {isExpanded && pendingCount > 0 && (
        <div className="flex flex-col gap-2">
          {pendingMembers.map((member) => (
            <NudgeCard 
              key={member.id}
              memberName={member.name}
              memberAvatar={member.avatar}
            />
          ))}
        </div>
      )}

      {/* Share Progress Button */}
      <button className="w-full h-12 bg-primary-500 rounded-2xl text-white text-[16px] font-normal leading-[24px] hover:opacity-90 transition-opacity" style={{ fontFamily: 'Inter, sans-serif' }}>
        Share Your Progress for {habit.name}
      </button>
    </div>
  );
};

