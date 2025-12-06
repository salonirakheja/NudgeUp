'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCommitments } from '@/contexts/CommitmentsContext';

interface Member {
  id: string;
  name: string;
  avatar: string;
  completedToday: boolean;
  streak: number;
  commitmentCompletions?: { [commitmentId: string]: boolean }; // Track individual commitment completions
}

interface TrackerTableProps {
  members: Member[];
}

export const TrackerTable = ({ members }: TrackerTableProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const { commitments, getCompletionForDate } = useCommitments();
  
  // Get commitments shared with this group
  const sharedCommitments = commitments.filter(c => c.groupIds?.includes(groupId));
  const today = new Date().toISOString().split('T')[0];
  
  // For "You" (current user), get actual completion status from commitments context
  const getMemberCommitmentCompletions = (memberId: string) => {
    // If it's the current user, get actual completion status
    if (memberId === '3' || memberId === 'current-user') {
      const completions: { [commitmentId: string]: boolean } = {};
      sharedCommitments.forEach(commitment => {
        completions[commitment.id] = getCompletionForDate(commitment.id, today);
      });
      return completions;
    }
    // For other members, use mock data or return empty (in real app, fetch from API)
    return members.find(m => m.id === memberId)?.commitmentCompletions || {};
  };

  const handleMemberClick = (memberId: string) => {
    router.push(`/groups/${groupId}/members/${memberId}`);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-neutral-700 text-[18px] font-semibold leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          Tracker
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

      {/* Table */}
      {isExpanded && (
        <div className="flex flex-col gap-3">
        {/* Table Header */}
        <div className="px-2 pb-2 border-b border-neutral-50 flex items-center gap-4">
          <div className="flex-1">
            <span className="text-neutral-400 text-[13px] font-medium leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Members
            </span>
          </div>
          {sharedCommitments.length > 0 ? (
            <>
              {/* Show individual commitment columns if there are shared commitments */}
              {sharedCommitments.map((commitment) => (
                <div key={commitment.id} className="w-10 flex flex-col items-center gap-1">
                  <div className="w-8 h-8 bg-neutral-50 rounded-xl flex items-center justify-center">
                    <span className="text-sm">{commitment.icon}</span>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="w-16 text-center">
              <span className="text-neutral-400 text-[13px] font-medium leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                Today
              </span>
            </div>
          )}
          <div className="w-16 text-right">
            <span className="text-neutral-400 text-[13px] font-medium leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Streak
            </span>
          </div>
        </div>

        {/* Member Rows */}
        {members.map((member) => {
          const commitmentCompletions = getMemberCommitmentCompletions(member.id);
          const allCompleted = sharedCommitments.length > 0 
            ? sharedCommitments.every(commitment => commitmentCompletions[commitment.id] === true)
            : member.completedToday;
          
          return (
            <div 
              key={member.id} 
              onClick={() => handleMemberClick(member.id)}
              className="px-2 py-2 rounded-2xl flex items-center gap-2 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              {/* Member Info */}
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-neutral-50 rounded-full flex justify-center items-center flex-shrink-0">
                  <span className="text-neutral-950 text-[16px] font-normal leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {member.avatar}
                  </span>
                </div>
                <span className="text-neutral-700 text-[16px] font-normal leading-[24px] truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {member.name}
                </span>
              </div>

              {/* Individual Commitment Completions */}
              {sharedCommitments.length > 0 ? (
                sharedCommitments.map((commitment) => {
                  const isCompleted = commitmentCompletions[commitment.id] === true;
                  return (
                    <div key={commitment.id} className="w-10 flex justify-center items-center">
                      {isCompleted ? (
                        <div className="w-6 h-6 bg-primary-500 rounded-full flex justify-center items-center">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-neutral-200 rounded-full flex justify-center items-center">
                          <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                /* Fallback: Single checkmark if no shared commitments */
                <div className="w-6 h-6 flex justify-center items-center">
                  {allCompleted ? (
                    <div className="w-6 h-6 bg-primary-500 rounded-full flex justify-center items-center">
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
              )}

              {/* Streak */}
              <div className="w-16 flex justify-end items-center gap-1 flex-shrink-0">
                <img 
                  src="/icons/Check-In Page/Icon-4.svg" 
                  alt="Streak" 
                  className="w-4 h-4"
                />
                <span className="text-neutral-700 text-[16px] font-normal leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {member.streak}
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

