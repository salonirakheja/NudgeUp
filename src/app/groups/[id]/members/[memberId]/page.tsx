'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { MemberProfileHeader } from '@/components/members/MemberProfileHeader';
import { StatsCards } from '@/components/members/StatsCards';
import { WeeklyChart } from '@/components/members/WeeklyChart';
import { SharedHabitsList } from '@/components/members/SharedHabitsList';
import { AchievementsSection } from '@/components/members/AchievementsSection';
import { SendEncouragementButton } from '@/components/members/SendEncouragementButton';
import { BottomNav } from '@/components/layout/BottomNav';
import { useCommitments } from '@/contexts/CommitmentsContext';
import { useGroups } from '@/contexts/GroupsContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { Commitment, CommitmentCompletion } from '@/types';

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const memberId = params.memberId as string;
  const { commitments, completions, getCommitmentStreak } = useCommitments();
  const { getGroupMembers } = useGroups();
  const { user } = useAuthContext();
  const currentUserId = user?.id || 'anonymous';

  // Get actual group members
  const groupMembers = getGroupMembers(groupId);
  
  // Find the specific member by memberId
  // Handle both 'current-user' ID and actual user IDs
  const actualMemberId = memberId === 'current-user' ? currentUserId : memberId;
  const member = groupMembers.find(m => {
    const mId = m.id === 'current-user' ? currentUserId : m.id;
    return mId === actualMemberId;
  });

  // If member not found, show fallback
  if (!member) {
    return (
      <div className="w-full max-w-[440px] min-h-[956px] relative bg-white mx-auto pb-20">
        <div className="px-6 pt-12">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-neutral-50 rounded-full inline-flex justify-center items-center mb-4"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.5 5L7.5 10L12.5 15" stroke="#4A5568" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <p className="text-neutral-500 text-center">Member not found</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Get commitments shared with this group
  const sharedCommitments = commitments.filter(c => c.groupIds?.includes(groupId));

  // Helper function to get completions for this member
  const getMemberCompletions = (): CommitmentCompletion[] => {
    if (actualMemberId === currentUserId) {
      // For current user, use completions from context
      return completions;
    }
    
    // For other members, read from their localStorage (only in browser)
    if (typeof window === 'undefined') {
      return [];
    }
    
    try {
      const memberCompletionsKey = `nudgeup_completions_${actualMemberId}`;
      const storedCompletions = localStorage.getItem(memberCompletionsKey);
      if (storedCompletions) {
        return JSON.parse(storedCompletions);
      }
    } catch (e) {
      console.warn('Error reading completions for member', actualMemberId, e);
    }
    
    return [];
  };

  // Helper function to get commitments for this member
  const getMemberCommitments = (): Commitment[] => {
    if (actualMemberId === currentUserId) {
      // For current user, use commitments from context
      return commitments;
    }
    
    // For other members, read from their localStorage (only in browser)
    if (typeof window === 'undefined') {
      return [];
    }
    
    try {
      const memberCommitmentsKey = `nudgeup_commitments_${actualMemberId}`;
      const storedCommitments = localStorage.getItem(memberCommitmentsKey);
      if (storedCommitments) {
        return JSON.parse(storedCommitments);
      }
    } catch (e) {
      console.warn('Error reading commitments for member', actualMemberId, e);
    }
    
    return [];
  };

  const memberCompletions = getMemberCompletions();
  const memberCommitments = getMemberCommitments();

  // Calculate stats based on actual data
  const memberStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Get member's shared commitments (matching by name and groupId)
    const memberSharedCommitments = sharedCommitments.map(sharedCommitment => {
      if (actualMemberId === currentUserId) {
        // For current user, use the same commitment object
        return sharedCommitment;
      }
      // For other members, find their copy of this commitment
      return memberCommitments.find(
        (c: Commitment) => c.name === sharedCommitment.name && c.groupIds?.includes(groupId)
      );
    }).filter(Boolean) as Commitment[];

    // Calculate current streak (highest streak among shared commitments)
    const streaks = memberSharedCommitments.map(commitment => {
      if (actualMemberId === currentUserId) {
        return getCommitmentStreak(commitment.id);
      }
      // For other members, calculate streak from their completions
      // Simple streak calculation: count consecutive days with completion
      let streak = 0;
      const commitmentCompletions = memberCompletions.filter(
        (c: CommitmentCompletion) => c.commitmentId === commitment.id && c.completed
      );
      if (commitmentCompletions.length > 0) {
        // Sort by date descending
        const sortedCompletions = commitmentCompletions
          .map(c => new Date(c.date).getTime())
          .sort((a, b) => b - a);
        
        // Count consecutive days from today backwards
        const todayTime = new Date(today).getTime();
        let checkDate = todayTime;
        while (sortedCompletions.includes(checkDate)) {
          streak++;
          checkDate -= 24 * 60 * 60 * 1000; // Subtract one day
        }
      }
      return streak;
    });
    const currentStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
    const longestStreak = currentStreak; // Simplified - in real app, track longest separately

    // Count active habits (shared commitments)
    const activeHabits = memberSharedCommitments.length;

    // Calculate today's completions
    const todayCompletions = memberSharedCommitments.filter(commitment => {
      if (actualMemberId === currentUserId) {
        const completion = memberCompletions.find(
          (c: CommitmentCompletion) => c.commitmentId === commitment.id && c.date === today && c.completed
        );
        return completion?.completed || false;
      } else {
        const completion = memberCompletions.find(
          (c: CommitmentCompletion) => c.commitmentId === commitment.id && c.date === today && c.completed
        );
        return completion?.completed || false;
      }
    });
    const todayCompleted = todayCompletions.length;
    const todayTotal = activeHabits;

    // Calculate weekly data
    const weeklyData = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDate = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = daysOfWeek[date.getDay()];
      const isToday = i === 0;
      
      // Count completions for this day
      const dayCompletions = memberSharedCommitments.filter(commitment => {
        const completion = memberCompletions.find(
          (c: CommitmentCompletion) => c.commitmentId === commitment.id && c.date === dateStr && c.completed
        );
        return completion?.completed || false;
      }).length;
      
      weeklyData.push({
        day: dayName,
        completed: dayCompletions,
        total: activeHabits,
        isToday,
      });
    }

    // Format member since date
    const formatMemberSince = (timestamp: string | undefined): string => {
      if (!timestamp) return 'Recently';
      try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return 'Recently';
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear();
        return `${month} ${year}`;
      } catch {
        return 'Recently';
      }
    };

    return {
      currentStreak,
      longestStreak,
      activeHabits,
      todayCompleted,
      todayTotal,
      weeklyData,
      memberSince: formatMemberSince(member.memberSince),
    };
  }, [member, sharedCommitments, memberCompletions, memberCommitments, actualMemberId, currentUserId, groupId, getCommitmentStreak]);

  // Get member's shared commitments with completion status
  const memberSharedHabits = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return sharedCommitments.map(commitment => {
      // Find member's copy of this commitment
      let memberCommitment: Commitment | undefined;
      if (actualMemberId === currentUserId) {
        memberCommitment = commitment;
      } else {
        memberCommitment = memberCommitments.find(
          (c: Commitment) => c.name === commitment.name && c.groupIds?.includes(groupId)
        );
      }

      if (!memberCommitment) {
        return null;
      }

      // Calculate streak for this commitment
      let commitmentStreak = 0;
      if (actualMemberId === currentUserId) {
        commitmentStreak = getCommitmentStreak(commitment.id);
      } else {
        // Calculate streak from completions
        const commitmentCompletions = memberCompletions.filter(
          (c: CommitmentCompletion) => c.commitmentId === memberCommitment!.id && c.completed
        );
        if (commitmentCompletions.length > 0) {
          const sortedCompletions = commitmentCompletions
            .map(c => new Date(c.date).getTime())
            .sort((a, b) => b - a);
          const todayTime = new Date(today).getTime();
          let checkDate = todayTime;
          while (sortedCompletions.includes(checkDate)) {
            commitmentStreak++;
            checkDate -= 24 * 60 * 60 * 1000;
          }
        }
      }

      // Check if completed today
      const completion = memberCompletions.find(
        (c: CommitmentCompletion) => c.commitmentId === memberCommitment!.id && c.date === today && c.completed
      );
      const completed = completion?.completed || false;

      return {
        id: memberCommitment.id,
        name: memberCommitment.name,
        icon: memberCommitment.icon,
        streak: commitmentStreak,
        completed,
      };
    }).filter(Boolean) as Array<{ id: string; name: string; icon: string; streak: number; completed: boolean }>;
  }, [sharedCommitments, memberCommitments, memberCompletions, actualMemberId, currentUserId, groupId, getCommitmentStreak]);

  // Mock achievements (can be enhanced later with actual achievement tracking)
  const achievements = useMemo(() => {
    const achievementList = [];
    if (memberStats.currentStreak >= 30) {
      achievementList.push({ id: '1', name: '30-Day Streak' });
    }
    if (memberStats.currentStreak >= 7) {
      achievementList.push({ id: '2', name: 'Perfect Week' });
    }
    if (memberStats.activeHabits >= 3) {
      achievementList.push({ id: '3', name: 'Motivator' });
    }
    return achievementList;
  }, [memberStats]);

  const memberData = {
    id: member.id,
    name: member.name,
    avatar: member.avatar,
    memberSince: memberStats.memberSince,
    currentStreak: memberStats.currentStreak,
    longestStreak: memberStats.longestStreak,
    activeHabits: memberStats.activeHabits,
    todayCompleted: memberStats.todayCompleted,
    todayTotal: memberStats.todayTotal,
    weeklyData: memberStats.weeklyData,
    sharedHabits: memberSharedHabits,
    achievements,
  };

  return (
    <div className="w-full max-w-[440px] min-h-[956px] relative bg-white mx-auto pb-20">
      {/* Header */}
      <MemberProfileHeader 
        member={memberData}
        onBack={() => router.back()}
      />

      {/* Stats Cards */}
      <div className="px-6 pt-6">
        <StatsCards member={memberData} />
      </div>

      {/* Weekly Chart */}
      <div className="px-6 pt-6">
        <WeeklyChart weeklyData={memberData.weeklyData} />
      </div>

      {/* Shared Habits */}
      {memberSharedHabits.length > 0 && (
        <div className="px-6 pt-6">
          <SharedHabitsList habits={memberSharedHabits} />
        </div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="px-6 pt-6">
          <AchievementsSection achievements={achievements} />
        </div>
      )}

      {/* Send Encouragement Button */}
      <div className="px-6 pt-6">
        <SendEncouragementButton />
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

