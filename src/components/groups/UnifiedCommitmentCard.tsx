'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

interface UnifiedCommitmentCardProps {
  commitment: Commitment;
  members: Member[];
  totalMembers: number;
}

export const UnifiedCommitmentCard = ({ commitment, members, totalMembers }: UnifiedCommitmentCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [nudgedMembers, setNudgedMembers] = useState<Set<string>>(new Set());
  const [nudgingMember, setNudgingMember] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const { getCompletionForDate } = useCommitments();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Get completion status for each member for this commitment
  const getMemberCommitmentCompletion = (memberId: string) => {
    if (memberId === 'current-user') {
      return getCompletionForDate(commitment.id, todayStr);
    }
    return members.find(m => m.id === memberId)?.commitmentCompletions?.[commitment.id] || false;
  };

  // Get current user's completion status
  const userCompletion = getMemberCommitmentCompletion('current-user');

  // Get members who haven't completed this commitment today
  const pendingMembers = members.filter(member => !getMemberCommitmentCompletion(member.id));
  const pendingCount = pendingMembers.length;

  // Get member display name (show "You" for current user)
  const getMemberDisplayName = (memberId: string, memberName: string) => {
    return memberId === 'current-user' ? 'You' : memberName;
  };

  const handleMemberClick = (memberId: string) => {
    router.push(`/groups/${groupId}/members/${memberId}`);
  };

  const handleNudge = async (memberId: string) => {
    setNudgingMember(memberId);
    
    // TODO: Implement actual nudge API call
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    
    setNudgedMembers(prev => new Set(prev).add(memberId));
    setNudgingMember(null);
  };

  const handleShareProgress = () => {
    // TODO: Implement share progress functionality
    if (navigator.share) {
      navigator.share({
        title: `My progress in ${commitment.name}`,
        text: `I've completed ${commitment.name}! Join me in this challenge.`,
      });
    } else {
      alert('Share your progress feature coming soon!');
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-md border border-neutral-100 overflow-hidden">
      {/* Collapsed State */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-4 py-4 flex items-center justify-between transition-all ${
          userCompletion 
            ? 'outline outline-2 outline-offset-[-2px]' 
            : 'outline outline-2 outline-offset-[-2px] outline-neutral-50'
        }`}
        style={userCompletion ? { outlineColor: '#DCE78A' } : {}}
      >
        {/* Left: Emoji + Title + Streak */}
        <div className="flex-1 flex items-center gap-3 min-w-0">
          {/* Icon */}
          <div className={`
            w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0
            ${userCompletion ? 'bg-success-100' : 'bg-neutral-50'}
          `}>
            <span className="text-neutral-950 text-2xl font-normal leading-8 tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
              {commitment.icon}
            </span>
          </div>

          {/* Title and Streak */}
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <div className="text-neutral-700 text-[16px] font-normal leading-[24px] truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
              {commitment.name}
            </div>
            <div className="flex items-center gap-2">
              <img 
                src="/icons/Check-In Page/Icon-4.svg" 
                alt="Streak" 
                className="w-4 h-4 flex-shrink-0"
                style={{ 
                  filter: 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)'
                }}
              />
              <span className="text-success-600 text-[13px] font-medium leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                {commitment.streak} day streak
              </span>
            </div>
          </div>
        </div>

        {/* Right: Today's Status + Expand Arrow */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Today's Status */}
          <div className="w-7 h-7 flex items-center justify-center">
            {userCompletion ? (
              <img 
                src="/icons/Check-In Page/Icon-3.svg" 
                alt="Completed" 
                className="w-7 h-7"
              />
            ) : (
              <img 
                src="/icons/Check-In Page/Icon-2.svg" 
                alt="Not completed" 
                className="w-7 h-7"
              />
            )}
          </div>

          {/* Expand Arrow */}
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 20 20" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          >
            <path d="M5 7.5L10 12.5L15 7.5" stroke="#4A5568" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>

      {/* Expanded State */}
      {isExpanded && (
        <div className="px-4 pb-3 pt-2 border-t border-neutral-100 flex flex-col gap-3">
          {/* Section 1: Today's Status */}
          <div className="flex flex-col gap-1.5">
            <div className="text-neutral-500 text-[12px] font-medium leading-[16px] uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
              Today's Status
            </div>
            
            {/* Members List - Horizontal */}
            <div className="flex flex-col gap-1">
              {members.map((member) => {
                const isCompleted = getMemberCommitmentCompletion(member.id);
                const displayName = getMemberDisplayName(member.id, member.name);
                return (
                  <div
                    key={member.id}
                    onClick={() => handleMemberClick(member.id)}
                    className="flex items-center gap-2 px-2 py-1 hover:bg-neutral-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <span className="text-[16px]">{member.avatar}</span>
                    <span className="text-neutral-700 text-[14px] font-normal leading-[20px] flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {displayName}
                    </span>
                    <span className="text-neutral-500 text-[13px] font-normal leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {isCompleted ? 'Done' : 'Not done'}
                    </span>
                    {/* Status Icon */}
                    <div className="w-4 h-4 flex justify-center items-center">
                      {isCompleted ? (
                        <div className="w-3 h-3 bg-primary-500 rounded-full flex justify-center items-center">
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6.5 2L3.5 5.5L1.5 4" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      ) : (
                        <div className="w-3 h-3 bg-neutral-300 rounded-full"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Soft Separator */}
          {pendingCount > 0 && (
            <div className="h-px bg-neutral-300 opacity-10"></div>
          )}

          {/* Section 2: Nudges - Only show if someone is pending */}
          {pendingCount > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="text-neutral-500 text-[12px] font-medium leading-[16px] uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
                Send Nudges
              </div>
              <div className="text-neutral-500 text-[12px] font-normal leading-[16px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                ({pendingCount} {pendingCount === 1 ? 'member hasn' : 'members haven'} checked in yet)
              </div>
              
              {/* Nudge Chips */}
              <div className="flex flex-col gap-1">
                {pendingMembers.map((member) => {
                  const isNudged = nudgedMembers.has(member.id);
                  const isNudging = nudgingMember === member.id;
                  const displayName = getMemberDisplayName(member.id, member.name);
                  
                  return (
                    <button
                      key={member.id}
                      onClick={() => !isNudged && handleNudge(member.id)}
                      disabled={isNudged || isNudging}
                      className={`
                        w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all
                        ${isNudged 
                          ? 'bg-success-50 border border-success-200' 
                          : 'bg-neutral-50 hover:bg-neutral-100 border border-transparent'
                        }
                        ${isNudging ? 'opacity-50' : ''}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[16px]">{member.avatar}</span>
                        <span className="text-neutral-700 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {displayName}
                        </span>
                      </div>
                      {isNudged ? (
                        <div className="flex items-center gap-1.5 text-success-600 text-[13px] font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <span>Nudged</span>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-in fade-in duration-200">
                            <path d="M11.5 3.5L5.5 9.5L2.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-neutral-500 text-[13px] font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <span>Nudge</span>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 3.5L9 7L5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Share Progress Button - Always at bottom for consistency */}
          <button
            onClick={handleShareProgress}
            className="w-full h-10 bg-primary-400 rounded-xl text-black text-[14px] font-medium leading-[20px] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-0.5"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 2.66667V13.3333M2.66667 8H13.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Share Progress
          </button>
        </div>
      )}
    </div>
  );
};

