'use client';

import { useParams, useRouter } from 'next/navigation';
import { GroupDetailHeader } from '@/components/groups/GroupDetailHeader';
import { SharedHabitsSection } from '@/components/groups/SharedHabitsSection';
import { TrackerTable } from '@/components/groups/TrackerTable';
import { BottomNav } from '@/components/layout/BottomNav';
import { useGroups } from '@/contexts/GroupsContext';
import { useCommitments } from '@/contexts/CommitmentsContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { Group, Commitment } from '@/types';

// Mock data - in real app, fetch from API based on id
const groupData: Group = {
  id: '2',
  name: 'Morning Routine Warriors',
  icon: '☀️',
  members: 8,
  daysLeft: 7,
  yourProgress: 23,
  groupAverage: 0,
  isAhead: false,
  description: 'Complete your morning routine before 8 AM every day',
  challengeDuration: 'Nov 17, 2024 - Nov 30, 2024',
  totalDays: 30,
};

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const { groups, deleteGroup, getGroupMembers } = useGroups();
  const { commitments, updateCommitment, completions, getCommitmentStreak } = useCommitments();
  const { user } = useAuthContext();
  const currentUserId = user?.id || 'anonymous';

  // Find the group from context, fallback to mock data if not found
  const group = groups.find(g => g.id === groupId) || groupData;

  // Get actual group members
  const groupMembers = getGroupMembers(groupId);
  
  // Convert GroupMember[] to Member[] format expected by SharedHabitsSection
  // and calculate completion status based on actual commitment completions
  const todayObj = new Date();
  const todayYear = todayObj.getFullYear();
  const todayMonth = todayObj.getMonth() + 1;
  const todayDay = todayObj.getDate();
  const today = `${todayYear}-${String(todayMonth).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
  
  // Get commitments shared with this group
  const sharedCommitments = commitments.filter(c => c.groupIds?.includes(groupId));
  
  // Helper function to get completions for a specific member
  const getMemberCompletions = (memberId: string) => {
    if (memberId === 'current-user' || memberId === currentUserId) {
      // For current user, use completions from context
      return completions;
    }
    
    // For other members, read from their localStorage (only in browser)
    if (typeof window === 'undefined') {
      return [];
    }
    
    try {
      const memberCompletionsKey = `nudgeup_completions_${memberId}`;
      const storedCompletions = localStorage.getItem(memberCompletionsKey);
      if (storedCompletions) {
        return JSON.parse(storedCompletions);
      }
    } catch (e) {
      console.warn('Error reading completions for member', memberId, e);
    }
    
    return [];
  };
  
  // Helper function to get commitments for a specific member (for pending count calculation)
  const getMemberCommitmentsForPending = (memberId: string): Commitment[] => {
    const actualMemberId = memberId === 'current-user' ? currentUserId : memberId;
    if (actualMemberId === currentUserId) {
      return commitments;
    }
    
    // Only access localStorage in browser environment
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

  // Calculate pending members count
  const actualPendingCount = groupMembers.filter(m => {
    if (m.id === 'current-user') return false;
    const actualMemberId = m.id === 'current-user' ? currentUserId : m.id;
    const memberCompletions = getMemberCompletions(actualMemberId);
    const memberCommitments = getMemberCommitmentsForPending(m.id);
    
    // Check if member completed any shared commitment today
    const hasCompletion = sharedCommitments.some(commitment => {
      // Find member's copy of this commitment
      const memberCommitment = memberCommitments.find(
        (c: Commitment) => c.name === commitment.name && c.groupIds?.includes(groupId)
      );
      
      if (!memberCommitment) {
        return false; // Member doesn't have this commitment
      }
      
      // Check if they completed their copy today
      const completion = memberCompletions.find(
        (c: any) => c.commitmentId === memberCommitment.id && c.date === today && c.completed
      );
      return completion?.completed || false;
    });
    return !hasCompletion;
  }).length;

  // Helper function to get commitments for a specific member
  const getMemberCommitments = (memberId: string): Commitment[] => {
    if (memberId === 'current-user' || memberId === currentUserId) {
      // For current user, use commitments from context
      return commitments;
    }
    
    // For other members, read from their localStorage (only in browser)
    if (typeof window === 'undefined') {
      return [];
    }
    
    try {
      const memberCommitmentsKey = `nudgeup_commitments_${memberId}`;
      const storedCommitments = localStorage.getItem(memberCommitmentsKey);
      if (storedCommitments) {
        return JSON.parse(storedCommitments);
      }
    } catch (e) {
      console.warn('Error reading commitments for member', memberId, e);
    }
    
    return [];
  };

  const members = groupMembers.map((member) => {
    // Get the actual member ID (convert 'current-user' to actual userId)
    const memberId = member.id === 'current-user' ? currentUserId : member.id;
    
    // Get completions and commitments for this member
    const memberCompletions = getMemberCompletions(memberId);
    const memberCommitments = getMemberCommitments(memberId);
    
    // Calculate commitment completions for this member
    const commitmentCompletions: { [commitmentId: string]: boolean } = {};
    sharedCommitments.forEach((commitment) => {
      // For current user, match by commitment ID (same commitment object)
      if (memberId === currentUserId) {
        const completion = memberCompletions.find(
          (c: any) => c.commitmentId === commitment.id && c.date === today && c.completed
        );
        commitmentCompletions[commitment.id] = completion?.completed || false;
      } else {
        // For other members, find their copy of this commitment by name and groupId
        // Each user has their own copy with a different ID, so we match by name + groupId
        const memberCommitment = memberCommitments.find(
          (c: Commitment) => c.name === commitment.name && c.groupIds?.includes(groupId)
        );
        
        if (memberCommitment) {
          // Check if they completed their copy of this commitment today
          const completion = memberCompletions.find(
            (c: any) => c.commitmentId === memberCommitment.id && c.date === today && c.completed
          );
          commitmentCompletions[commitment.id] = completion?.completed || false;
        } else {
          // Member doesn't have this commitment yet
          commitmentCompletions[commitment.id] = false;
        }
      }
    });

    // Check if member completed any commitment today
    const completedToday = Object.values(commitmentCompletions).some(completed => completed);

    // Calculate streak for current user from actual commitment completions
    let calculatedStreak = member.streak || member.currentStreak || 0;
    if (member.id === 'current-user' && sharedCommitments.length > 0) {
      // Calculate streak from shared commitments - use the highest streak among shared commitments
      const streaks = sharedCommitments.map(commitment => getCommitmentStreak(commitment.id));
      calculatedStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
    }

    return {
      id: member.id,
      name: member.name,
      avatar: member.avatar,
      completedToday,
      streak: calculatedStreak,
        commitmentCompletions,
    };
  });

  const handleDelete = () => {
    // Remove groupId from any commitments that were shared with this group
    commitments.forEach((commitment) => {
      if (commitment.groupIds?.includes(groupId)) {
        const updatedGroupIds = commitment.groupIds.filter(id => id !== groupId);
        updateCommitment(commitment.id, { groupIds: updatedGroupIds.length > 0 ? updatedGroupIds : undefined });
      }
    });

    // Delete the group
    deleteGroup(groupId);

    // Navigate back to groups page
    router.push('/groups');
  };

  return (
    <div className="w-full max-w-[440px] min-h-[956px] relative bg-white mx-auto pb-20">
      {/* Header */}
      <GroupDetailHeader 
        group={group}
        members={members.map(m => ({ id: m.id, name: m.name, avatar: m.avatar, completedToday: m.completedToday, streak: m.streak }))}
        onBack={() => router.back()}
        onDelete={handleDelete}
      />

          {/* Shared Commitments Section (includes individual trackers and nudges for each commitment) */}
      <div className="px-6 pt-6">
        <SharedHabitsSection 
          groupId={groupId} 
          members={members}
          totalMembers={members.length}
        />
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

