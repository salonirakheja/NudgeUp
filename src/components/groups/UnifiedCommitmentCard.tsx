'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Commitment } from '@/types';
import { useCommitments } from '@/contexts/CommitmentsContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useGroups } from '@/contexts/GroupsContext';
import { tx, id, db, useAuth } from '@/lib/instant';

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
  const params = useParams();
  const groupId = params.id as string;
  const { getCompletionForDate, getCommitmentStreak, completions } = useCommitments();
  const { user } = useAuthContext();
  const { groups, getGroupMembers } = useGroups();
  
  // Check InstantDB auth state
  const { user: instantUser, isLoading: authLoading } = useAuth();
  
  // Get current user info for sender
  const currentUserId = user?.id || 'anonymous';
  const senderName = user?.name || (typeof window !== 'undefined' ? localStorage.getItem('userName') : null) || 'Someone';
  const senderAvatar = (typeof window !== 'undefined' ? localStorage.getItem('userAvatar') : null) || '😊';
  const senderAvatarImage = (typeof window !== 'undefined' ? localStorage.getItem('userAvatarImage') : null);
  
  // Get group name
  const group = groups.find(g => g.id === groupId);
  const groupName = group?.name || 'Group';
  
  // Helper to get actual user ID for a member
  // This ensures we use the correct recipient ID when storing nudges
  const getActualMemberUserId = (memberId: string): string => {
    // If member ID is 'current-user', it means it's the sender themselves (shouldn't happen, but handle it)
    if (memberId === 'current-user') {
      return currentUserId;
    }
    
    // For other members, their ID should be their actual user ID
    // But let's verify by checking the group members list
    const groupMembers = getGroupMembers(groupId);
    const member = groupMembers.find(m => m.id === memberId || (m.id === 'current-user' && memberId === currentUserId));
    
    if (member) {
      // If member has 'current-user' ID, it's actually the current user
      if (member.id === 'current-user') {
        return currentUserId;
      }
      // Otherwise, use the member's actual ID
      return member.id;
    }
    
    // Fallback: use memberId as-is (should be actual user ID)
    return memberId;
  };
  
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

  // Check if a member has been nudged recently (within 1 hour)
  const hasBeenNudgedRecently = (memberId: string): boolean => {
    if (typeof window === 'undefined') return false;
    
    const STORAGE_KEY_NUDGES = 'nudgeup_nudges';
    const stored = localStorage.getItem(STORAGE_KEY_NUDGES);
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
      
      return !!recentNudge;
    }
    return false;
  };

  // Check if a member can be nudged
  const canNudgeMember = (memberId: string): boolean => {
    // Can't nudge yourself
    if (memberId === 'current-user') {
      return false;
    }
    
    // Can't nudge if already nudged (in current session)
    if (nudgedMembers.has(memberId)) {
      return false;
    }
    
    // Can't nudge if currently nudging
    if (nudgingMember === memberId) {
      return false;
    }
    
    // Can't nudge if already nudged recently (check localStorage)
    if (hasBeenNudgedRecently(memberId)) {
      return false;
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
      
      // Get actual member ID (convert 'current-user' to actual user ID)
      const actualMemberId = getActualMemberUserId(memberId);
      
      // Validate that we have valid user IDs
      if (!actualMemberId || actualMemberId === 'anonymous') {
        console.error('❌ Invalid recipient user ID:', actualMemberId);
        alert('Unable to send nudge: Invalid recipient.');
        setNudgingMember(null);
        return;
      }
      
      if (!currentUserId || currentUserId === 'anonymous') {
        console.error('❌ Invalid sender user ID:', currentUserId);
        alert('Unable to send nudge: Please sign in.');
        setNudgingMember(null);
        return;
      }
      
      // Create nudge in InstantDB
      const nudgeId = id();
      console.log('📤 Creating nudge:', {
        nudgeId,
        toUserId: actualMemberId,
        fromUserId: currentUserId,
        habitId: commitment.id,
        groupId,
        createdAt: now,
      });
      
      try {
        if (!db) {
          throw new Error('db is not initialized');
        }
        
        // Verify InstantDB auth is synced - this is critical for permissions to work
        if (authLoading) {
          console.log('⏳ Waiting for InstantDB auth to load...');
          // Wait for auth to load
          let attempts = 0;
          while (authLoading && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
          }
        }
        
        if (!instantUser) {
          console.error('❌ InstantDB user not available. Cannot create nudge without authentication.');
          alert('Please wait for authentication to complete and try again.');
          setNudgingMember(null);
          return;
        }
        
        if (instantUser.id !== currentUserId) {
          console.error('❌ InstantDB auth ID mismatch:', {
            instantUserId: instantUser.id,
            currentUserId,
            note: 'This will cause permission failures. Please refresh the page.',
          });
          alert('Authentication mismatch. Please refresh the page and try again.');
          setNudgingMember(null);
          return;
        }
        
        console.log('✅ InstantDB auth verified:', {
          instantUserId: instantUser.id,
          currentUserId,
          match: instantUser.id === currentUserId,
        });
        
        // Create nudge - must use db.transact() to actually commit
        const nudgeData = {
          toUserId: actualMemberId,
          fromUserId: currentUserId,
          habitId: commitment.id,
          groupId,
          createdAt: now,
          resolvedAt: null,
        };
        
        // Log the transaction details before sending
        console.log('📤 Creating nudge transaction:', {
          nudgeId,
          nudgeData,
          fromUserId: nudgeData.fromUserId,
          toUserId: nudgeData.toUserId,
          dbAvailable: !!db,
          currentUserId,
          actualMemberId,
          instantUserId: instantUser?.id,
          instantAuthSynced: instantUser?.id === currentUserId,
        });
        
        // Use update() which works as upsert (create if doesn't exist, update if it does)
        // This matches the pattern used in SendNudgesSection.tsx
        try {
          // Send the transaction
          await db.transact(tx.nudges[nudgeId].update(nudgeData));
          console.log('✅ Nudge transaction sent successfully', {
            nudgeId,
            toUserId: actualMemberId,
            fromUserId: currentUserId,
            habitId: commitment.id,
            groupId,
          });
        } catch (transactError: any) {
          console.error('❌ Transaction error:', transactError);
          throw new Error(`Failed to commit nudge transaction: ${transactError?.message || 'Unknown error'}`);
        }
      } catch (error: any) {
        console.error('❌ Error creating nudge transaction:', error);
        console.error('Error details:', {
          message: error?.message,
          stack: error?.stack,
          nudgeId,
          nudgeData: {
            toUserId: actualMemberId,
            fromUserId: currentUserId,
            habitId: commitment.id,
            groupId,
          },
        });
        alert('Failed to send nudge. Please check console for details.');
        setNudgingMember(null);
        return;
      }
      
      // Also save nudge record in sender's localStorage (for rate limiting)
      if (typeof window !== 'undefined') {
        const nudge = {
          id: nudgeId,
          groupId,
          memberId,
          commitmentId: commitment.id,
          type: 'individual',
          timestamp: now,
        };
        nudges.push(nudge);
        localStorage.setItem(STORAGE_KEY_NUDGES, JSON.stringify(nudges));
        
        console.log('📤 Nudge created in InstantDB:', {
          nudgeId,
          memberIdFromUI: memberId,
          actualMemberId,
          senderId: currentUserId,
          senderName,
          commitmentName: commitment.name,
          groupName,
          timestamp: new Date(now).toISOString(),
        });
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
                // Check if this is the current user - handle both 'current-user' ID and actual user ID
                const isCurrentUser = member.id === 'current-user' || (currentUserId !== 'anonymous' && member.id === currentUserId);
                // Check if nudged in current session OR in localStorage (within last hour)
                const isNudgedInSession = nudgedMembers.has(member.id);
                const isNudgedRecently = hasBeenNudgedRecently(member.id);
                const isNudged = isNudgedInSession || isNudgedRecently;
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
                      className="flex items-center gap-2 flex-1"
                  >
                    <div className="w-8 h-8 bg-neutral-50 rounded-full flex justify-center items-center flex-shrink-0 overflow-hidden">
                      {member.avatar && (member.avatar.startsWith('data:') || member.avatar.startsWith('http')) ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[16px]">{member.avatar || '😊'}</span>
                      )}
                    </div>
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
                          } else if (isCompleted) {
                            // Show message if member has checked in
                            alert(`${displayName} has already checked in today.`);
                          } else if (!canNudge && !isNudged) {
                            // Show message if rate limited
                            alert('Please wait at least 1 hour before nudging this member again.');
                          }
                        }}
                        disabled={isCompleted || isNudging}
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

