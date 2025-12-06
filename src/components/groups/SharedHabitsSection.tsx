'use client';

import { useState } from 'react';
import { Commitment } from '@/types';
import { useCommitments } from '@/contexts/CommitmentsContext';
import { UnifiedCommitmentCard } from './UnifiedCommitmentCard';

interface Member {
  id: string;
  name: string;
  avatar: string;
  completedToday: boolean;
  streak: number;
  commitmentCompletions?: { [commitmentId: string]: boolean };
}

interface SharedHabitsSectionProps {
  groupId: string;
  members: Member[];
  totalMembers: number;
}

export const SharedHabitsSection = ({ groupId, members, totalMembers }: SharedHabitsSectionProps) => {
  const { commitments } = useCommitments();
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Get commitments that are shared with this group (where groupIds array includes this group's id)
  const sharedCommitments = commitments.filter(commitment => commitment.groupIds?.includes(groupId));

  if (sharedCommitments.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-neutral-700 text-[18px] font-semibold leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          Shared Commitments ({sharedCommitments.length})
        </h3>
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

      {/* Unified Commitment Cards */}
      {isExpanded && (
        <div className="flex flex-col gap-2">
          {sharedCommitments.map((commitment) => (
            <UnifiedCommitmentCard
              key={commitment.id}
              commitment={commitment}
              members={members}
              totalMembers={totalMembers}
            />
          ))}
        </div>
      )}
    </div>
  );
};

