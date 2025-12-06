'use client';

import { useParams, useRouter } from 'next/navigation';
import { GroupDetailHeader } from '@/components/groups/GroupDetailHeader';
import { SharedHabitsSection } from '@/components/groups/SharedHabitsSection';
import { TrackerTable } from '@/components/groups/TrackerTable';
import { BottomNav } from '@/components/layout/BottomNav';
import { useGroups } from '@/contexts/GroupsContext';
import { useCommitments } from '@/contexts/CommitmentsContext';
import { Group } from '@/types';

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
  
  // Calculate pending members count
  const actualPendingCount = groupMembers.filter(m => {
    if (m.id === 'current-user') return false;
    // Check if member completed any shared commitment today
    const memberCompletions = sharedCommitments.map(commitment => {
      // For current user, check actual completions
      if (m.id === 'current-user') {
        const completion = completions.find(
          c => c.commitmentId === commitment.id && c.date === today && c.completed
        );
        return completion?.completed || false;
      }
      return false; // For other members, we'd need their completion data
    });
    return !memberCompletions.some(completed => completed);
  }).length;
  
  const members = groupMembers.map((member) => {
    // Calculate commitment completions for this member
    const commitmentCompletions: { [commitmentId: string]: boolean } = {};
    sharedCommitments.forEach((commitment) => {
      // For current user, check actual completions
      if (member.id === 'current-user') {
        const completion = completions.find(
          c => c.commitmentId === commitment.id && c.date === today && c.completed
        );
        commitmentCompletions[commitment.id] = completion?.completed || false;
      } else {
        // For other members, we'd need to fetch from API in a real app
        // For now, use the member's sharedCommitments if available
        commitmentCompletions[commitment.id] = member.sharedCommitments?.some(c => c.id === commitment.id) || false;
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

