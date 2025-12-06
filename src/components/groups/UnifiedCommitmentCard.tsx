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
  const { getCompletionForDate, getCommitmentStreak, completions } = useCommitments();
  
  // Calculate streak dynamically from completions to ensure consistency
  // Calculate directly here to ensure we always use the latest completions array
  const calculatedStreak = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let currentDate = new Date(today);

    // Check backwards from today
    while (true) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const completion = completions.find(
        (c) => c.commitmentId === commitment.id && c.date === dateStr && c.completed
      );

      if (completion?.completed) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
        currentDate.setHours(0, 0, 0, 0);
      } else {
        break;
      }
    }

    return streak;
  })();
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

  // Check if a member can be nudged
  const canNudgeMember = (memberId: string): boolean => {
    // Can't nudge yourself
    if (memberId === 'current-user') {
      return false;
    }
    
    // Can't nudge if already nudged
    if (nudgedMembers.has(memberId)) {
      return false;
    }
    
    // Can't nudge if currently nudging
    if (nudgingMember === memberId) {
      return false;
    }
    
    // Check rate limiting (1 hour cooldown)
    const STORAGE_KEY_NUDGES = 'nudgeup_nudges';
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_NUDGES) : null;
    if (stored) {
      const nudges = JSON.parse(stored);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      const recentNudge = nudges.find((n: any) => 
        n.groupId === groupId && 
        n.memberId === memberId && 
        n.commitmentId === commitment.id &&
        n.type === 'individual' &&
        (now - n.timestamp) < oneHour
      );
      
      if (recentNudge) {
        return false;
      }
    }
    
    return true;
  };

  const handleNudge = async (memberId: string) => {
    setNudgingMember(memberId);
    
    try {
      // Check if we can nudge (prevent spam)
      const STORAGE_KEY_NUDGES = 'nudgeup_nudges';
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_NUDGES) : null;
      const nudges = stored ? JSON.parse(stored) : [];
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      const recentNudge = nudges.find((n: any) => 
        n.groupId === groupId && 
        n.memberId === memberId && 
        n.commitmentId === commitment.id &&
        (now - n.timestamp) < oneHour
      );
      
      if (recentNudge) {
        alert('Please wait at least 1 hour before nudging this member again.');
        setNudgingMember(null);
        return;
      }
      
      // Save nudge record
      const nudge = {
        id: `${Date.now()}-${memberId}-${commitment.id}`,
        groupId,
        memberId,
        commitmentId: commitment.id,
        type: 'individual',
        timestamp: now,
      };
      
      if (typeof window !== 'undefined') {
        nudges.push(nudge);
        localStorage.setItem(STORAGE_KEY_NUDGES, JSON.stringify(nudges));
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setNudgedMembers(prev => new Set(prev).add(memberId));
    } catch (error) {
      console.error('Error sending nudge:', error);
      alert('Failed to send nudge. Please try again.');
    } finally {
      setNudgingMember(null);
    }
  };

  const handleShareProgress = async () => {
    const shareText = `I've completed ${commitment.name} with a ${calculatedStreak}-day streak! 🔥\n\nJoin me in this challenge!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My progress in ${commitment.name}`,
          text: shareText,
        });
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else if (navigator.clipboard) {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Progress copied to clipboard!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        alert('Failed to copy. Please try again.');
      }
    } else {
      alert('Sharing is not supported on this device.');
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
          <div className="flex-1 flex flex-col gap-1 min-w-0 items-start">
            <div className="text-neutral-700 text-[16px] font-normal leading-[24px] truncate text-left w-full" style={{ fontFamily: 'Inter, sans-serif' }}>
              {commitment.name}
            </div>
            <div className="flex items-center gap-2 justify-start">
              <img 
                src="/icons/Check-In Page/Icon-4.svg" 
                alt="Streak" 
                className="w-4 h-4 flex-shrink-0"
                style={{ 
                  filter: 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)'
                }}
              />
              <span className="text-success-600 text-[13px] font-medium leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                {calculatedStreak} day streak
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
                const isCurrentUser = member.id === 'current-user';
                const isNudged = nudgedMembers.has(member.id);
                const isNudging = nudgingMember === member.id;
                // Button is active (enabled) only if member has NOT checked in today
                const isNudgeActive = !isCompleted && !isCurrentUser;
                // Check if we can actually nudge (rate limiting, etc.)
                const canNudge = isNudgeActive && canNudgeMember(member.id);
                
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 px-2 py-1 hover:bg-neutral-50 rounded-lg transition-colors"
                  >
                    <div
                      onClick={() => handleMemberClick(member.id)}
                      className="flex items-center gap-2 flex-1 cursor-pointer"
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
                    
                    {/* Inline Nudge Button - Show for all members except current user */}
                    {!isCurrentUser && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (isNudgeActive && canNudge && !isNudging) {
                            handleNudge(member.id);
                          } else if (!isNudgeActive) {
                            // Show message if member has checked in
                            alert(`${displayName} has already checked in today.`);
                          }
                        }}
                        disabled={!isNudgeActive || isNudging}
                        type="button"
                        className={`
                          flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[12px] font-medium flex-shrink-0 min-w-[70px] justify-center
                          ${isNudged 
                            ? 'bg-success-50 text-success-600 border border-success-200' 
                            : isNudgeActive && canNudge
                            ? 'bg-primary-100 text-primary-700 hover:bg-primary-200 border border-primary-300 cursor-pointer'
                            : 'bg-neutral-100 text-neutral-400 border border-neutral-300 cursor-not-allowed'
                          }
                          ${isNudging ? 'opacity-50 cursor-wait' : ''}
                        `}
                        style={{ fontFamily: 'Inter, sans-serif' }}
                        title={isCompleted ? 'Member has checked in' : isNudged ? 'Already nudged' : isNudgeActive ? 'Send nudge' : 'Member has checked in'}
                      >
                        {isNudged ? (
                          <>
                            <span>Nudged</span>
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.5 3.5L5.5 9.5L2.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </>
                        ) : (
                          <>
                            <span>Nudge</span>
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 3.5L9 7L5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

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

