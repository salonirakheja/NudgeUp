'use client';

import { useParams, useRouter } from 'next/navigation';
import { MemberProfileHeader } from '@/components/members/MemberProfileHeader';
import { StatsCards } from '@/components/members/StatsCards';
import { WeeklyChart } from '@/components/members/WeeklyChart';
import { SharedHabitsList } from '@/components/members/SharedHabitsList';
import { AchievementsSection } from '@/components/members/AchievementsSection';
import { SendEncouragementButton } from '@/components/members/SendEncouragementButton';
import { BottomNav } from '@/components/layout/BottomNav';
import { useCommitments } from '@/contexts/CommitmentsContext';

// Mock data - in real app, fetch from API based on memberId
const memberData = {
  id: '1',
  name: 'Emma Rodriguez',
  avatar: '👩',
  memberSince: 'Jul 2024',
  currentStreak: 31,
  longestStreak: 31,
  activeHabits: 5,
  todayCompleted: 5,
  todayTotal: 5,
  weeklyData: [
    { day: 'Mon', completed: 5, total: 5 },
    { day: 'Tue', completed: 5, total: 5 },
    { day: 'Wed', completed: 4, total: 5 },
    { day: 'Thu', completed: 5, total: 5 },
    { day: 'Fri', completed: 5, total: 5 },
    { day: 'Sat', completed: 5, total: 5 },
    { day: 'Sun', completed: 5, total: 5, isToday: true },
  ],
  sharedHabits: [
    { id: '1', name: 'Morning Meditation', icon: '🧘', streak: 31, completed: true },
    { id: '2', name: 'Drink Water', icon: '💧', streak: 31, completed: true },
    { id: '3', name: 'Read 30 Minutes', icon: '📚', streak: 29, completed: true },
  ],
  achievements: [
    { id: '1', name: '30-Day Streak' },
    { id: '2', name: 'Perfect Week' },
    { id: '3', name: 'Motivator' },
  ],
};

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const memberId = params.memberId as string;
  const { commitments } = useCommitments();

  // Get commitments shared with this group (where groupIds array includes this group's id)
  const sharedCommitments = commitments.filter(c => c.groupIds?.includes(groupId));

  // In real app, fetch member data based on memberId
  // For now, using mock data with actual shared habits

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
      {sharedCommitments.length > 0 && (
        <div className="px-6 pt-6">
          <SharedHabitsList habits={sharedCommitments} />
        </div>
      )}

      {/* Achievements */}
      <div className="px-6 pt-6">
        <AchievementsSection achievements={memberData.achievements} />
      </div>

      {/* Send Encouragement Button */}
      <div className="px-6 pt-6">
        <SendEncouragementButton />
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

