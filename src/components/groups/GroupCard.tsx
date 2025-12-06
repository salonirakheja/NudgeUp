'use client';

import { useRouter } from 'next/navigation';
import { useCommitments } from '@/contexts/CommitmentsContext';
import { useGroups } from '@/contexts/GroupsContext';

interface Group {
  id: string;
  name: string;
  icon: string;
  members: number;
  daysLeft: number;
  yourProgress: number;
  groupAverage: number;
  isAhead: boolean;
  inviteCode?: string;
}

interface GroupCardProps {
  group: Group;
}

// FriendPill Component
interface FriendPillProps {
  members: Array<{ id: string; avatar: string; name: string }>;
  totalCount: number;
  onClick: () => void;
}

const FriendPill = ({ members, totalCount, onClick }: FriendPillProps) => {
  const displayMembers = members.slice(0, 2); // Show 2-3 avatars (we'll show 2 + + icon)
  const hasMore = totalCount > 2;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-alert-400 hover:opacity-90 transition-opacity shadow-sm flex-shrink-0"
      title="Share invite link"
    >
      {/* Friend Avatars */}
      <div className="flex items-center -space-x-1.5">
        {displayMembers.map((member, index) => (
          <div
            key={member.id}
            className="w-5 h-5 bg-white rounded-full flex items-center justify-center border-2 border-alert-400 shadow-sm overflow-hidden"
            style={{ zIndex: displayMembers.length - index }}
            title={member.name}
          >
            {member.avatar && (member.avatar.startsWith('data:') || member.avatar.startsWith('http')) ? (
              <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px]">{member.avatar || '😊'}</span>
            )}
          </div>
        ))}
        {/* Plus icon */}
        <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center border-2 border-alert-400 shadow-sm">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 1.5V8.5M1.5 5H8.5" stroke="#FFB412" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </button>
  );
};

export const GroupCard = ({ group }: GroupCardProps) => {
  const router = useRouter();
  const { commitments, completions, getCommitmentStreak, getWeeklyCompletionCount } = useCommitments();
  const { getGroupMembers } = useGroups();
  
  // Get commitments shared with this group (where groupIds array includes this group's id)
  const sharedCommitments = commitments.filter(c => c.groupIds?.includes(group.id));
  const sharedCommitmentsCount = sharedCommitments.length;

  // Separate daily and weekly commitments
  const dailyCommitments = sharedCommitments.filter(c => !c.frequencyType || c.frequencyType === 'daily');
  const weeklyCommitments = sharedCommitments.filter(c => c.frequencyType === 'weekly');

  // Calculate challenge start date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totalDays = group.totalDays || 30; // Default to 30 days if not available
  const daysElapsed = totalDays - group.daysLeft;
  
  // Calculate start date
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - daysElapsed);
  startDate.setHours(0, 0, 0, 0);
  
  // Helper function to format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };
  
  // Calculate "Your Progress" - cumulative days done
  // Count days where at least one shared commitment was completed
  let yourCumulativeDays = 0;
  let dailyCumulativeDays = 0;
  let weeklyCumulativeDays = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= today) {
    const dateStr = formatDate(currentDate);
    
    // Check if at least one daily commitment was completed on this day
    const hasDailyCompletion = dailyCommitments.some(commitment => {
      const completion = completions.find(
        c => c.commitmentId === commitment.id && 
             c.date === dateStr && 
             c.completed
      );
      return completion?.completed || false;
    });
    
    // Check if at least one weekly commitment was completed on this day
    const hasWeeklyCompletion = weeklyCommitments.some(commitment => {
    const completion = completions.find(
        c => c.commitmentId === commitment.id && 
             c.date === dateStr && 
             c.completed
    );
    return completion?.completed || false;
    });
  
    // Check if at least one shared commitment was completed on this day
    const hasCompletion = hasDailyCompletion || hasWeeklyCompletion;
    
    if (hasCompletion) {
      yourCumulativeDays++;
    }
    if (hasDailyCompletion) {
      dailyCumulativeDays++;
    }
    if (hasWeeklyCompletion) {
      weeklyCumulativeDays++;
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Calculate progress bar percentage for "Your Progress"
  const yourProgressPercent = daysElapsed > 0 
    ? Math.min(Math.round((yourCumulativeDays / daysElapsed) * 100), 100)
    : 0;
  
  // Calculate "Group Average" - average cumulative days done
  // For now, use same calculation as "Your Progress" until member data is available
  // TODO: Calculate from actual member completion data when available
  const groupAverageCumulativeDays = yourCumulativeDays;
  
  // Calculate progress bar percentage for "Group Average"
  const groupAveragePercent = daysElapsed > 0
    ? Math.min(Math.round((groupAverageCumulativeDays / daysElapsed) * 100), 100)
    : 0;
  
  // Get group members
  const groupMembers = getGroupMembers(group.id);
  const otherMembers = groupMembers.filter(m => m.id !== 'current-user');
  const totalOtherMembers = otherMembers.length;
  
  // Determine status message based on progress comparison
  // Calculate today's completion for status message
  const todayStr = formatDate(today);
  const completedToday = sharedCommitments.filter(commitment => {
    const completion = completions.find(
      c => c.commitmentId === commitment.id && c.date === todayStr && c.completed
    );
    return completion?.completed || false;
  }).length;
  const pendingCount = sharedCommitmentsCount - completedToday;
  
  let statusMessage = '';
  let showStatus = false;
  if (sharedCommitmentsCount > 0) {
    if (yourCumulativeDays > groupAverageCumulativeDays) {
      statusMessage = "You're ahead of the group! 🎉";
      showStatus = true;
    } else if (yourCumulativeDays === groupAverageCumulativeDays) {
      statusMessage = `Today: ${completedToday} completed · ${pendingCount} pending`;
      showStatus = true;
    } else if (yourCumulativeDays < groupAverageCumulativeDays) {
      statusMessage = "Running behind the group";
      showStatus = true;
    }
  }
  
  // Calculate members ahead/behind
  const membersAhead = Math.floor(totalOtherMembers * 0.3); // Mock: assume 30% are ahead
  const membersBehind = Math.floor(totalOtherMembers * 0.2); // Mock: assume 20% are behind
  
  // Calculate weekly trend (completions this week / total possible)
  const getWeekStart = () => {
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysFromMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };
  
  const weekStart = getWeekStart();
  const weekCompletions = sharedCommitments.reduce((count, commitment) => {
    let weekCount = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      date.setHours(0, 0, 0, 0);
      if (date > today) break; // Don't count future days
      
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const completion = completions.find(
        c => c.commitmentId === commitment.id && c.date === dateStr && c.completed
      );
      if (completion?.completed) weekCount++;
    }
    return count + weekCount;
  }, 0);
  
  const totalPossibleThisWeek = sharedCommitmentsCount * Math.min(7, Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const weeklyTrendPercent = totalPossibleThisWeek > 0 
    ? Math.round((weekCompletions / totalPossibleThisWeek) * 100)
    : 0;
  
  // Find member with recent streak (completed 3+ days in a row)
  const getMemberStreak = (member: typeof groupMembers[0]) => {
    if (member.id === 'current-user') {
      // Calculate current user's streak from actual commitments
      return sharedCommitments.length > 0 ? getCommitmentStreak(sharedCommitments[0].id) : 0;
    }
    return member.streak || member.currentStreak || 0;
  };
  
  const memberWithStreak = otherMembers.find(m => getMemberStreak(m) >= 3);
  
  // Generate context lines
  const contextLines: string[] = [];
  if (membersAhead > 0) {
    contextLines.push(`You're ahead of ${membersAhead} ${membersAhead === 1 ? 'member' : 'members'}`);
  }
  if (weeklyTrendPercent > 0) {
    contextLines.push(`Group is trending ${weeklyTrendPercent}% this week`);
  }
  if (memberWithStreak) {
    const streak = getMemberStreak(memberWithStreak);
    contextLines.push(`${memberWithStreak.name} completed ${streak} days in a row`);
  }
  
  const inviteCode = group.inviteCode || `GRP${group.id.padStart(3, '0')}`;
  const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${inviteCode}`;
  
  const displayMembers = groupMembers.slice(0, 4); // Show up to 4 member avatars

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on invite pill
    if ((e.target as HTMLElement).closest('.invite-pill')) {
      return;
    }
    router.push(`/groups/${group.id}`);
  };

  const handleShareInvite = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to group detail page
    if (navigator.share) {
      navigator.share({
        title: `Join ${group.name}`,
        text: `Join me in ${group.name}! Use code: ${inviteCode}`,
        url: inviteLink,
      });
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(inviteLink);
      alert(`Invite link copied to clipboard!\nCode: ${inviteCode}\nLink: ${inviteLink}`);
    }
  };

  const handleShareProgress = (e: React.MouseEvent) => {
    e.stopPropagation();
    const progressText = `I've completed ${yourCumulativeDays} days in ${group.name}! Join me: ${inviteLink}`;
    if (navigator.share) {
      navigator.share({
        title: `My progress in ${group.name}`,
        text: progressText,
        url: inviteLink,
      });
    } else {
      navigator.clipboard.writeText(progressText);
      alert('Progress shared to clipboard!');
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="w-full relative bg-white rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-shadow overflow-hidden border border-[#E5E5EA]"
    >
      {/* Header Section - Reduced padding by ~15% */}
      <div className="px-6 pt-3.5 pb-2.5 flex items-start gap-3">
        {/* Icon - Left aligned */}
        <div className="w-12 h-12 bg-white/60 rounded-2xl flex justify-center items-center flex-shrink-0">
          <span className="text-neutral-950 text-2xl font-normal leading-8 tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
            {group.icon}
          </span>
        </div>

        {/* Group Info - Clean vertical stack */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          {/* Group Name */}
          <h3 className="text-neutral-700 text-[16px] font-semibold leading-[24px] truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
            {group.name}
          </h3>
          
          {/* Days Left and Commitment Badge - Stacked */}
          <div className="flex flex-col gap-1">
            <span className="text-neutral-500 text-[13px] font-normal leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              {group.daysLeft} days left
            </span>
            {/* Commitment Badge - Softer green, smaller padding, more rounded */}
            {sharedCommitmentsCount > 0 && (
              <span className="text-[11px] font-medium bg-[#E8F5E9] text-[#4CAF50] px-2 py-0.5 rounded-full whitespace-nowrap w-fit leading-[14px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                {sharedCommitmentsCount} {sharedCommitmentsCount === 1 ? 'commitment' : 'commitments'}
              </span>
            )}
          </div>
        </div>

        {/* Member Avatars - Right aligned, reduced size */}
        {displayMembers.length > 0 && (
          <div className="flex items-center -space-x-1.5 flex-shrink-0">
            {displayMembers.map((member, index) => (
              <div
                key={member.id}
                className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden"
                style={{ zIndex: displayMembers.length - index }}
                title={member.name}
              >
                {member.avatar && (member.avatar.startsWith('data:') || member.avatar.startsWith('http')) ? (
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[9px]">{member.avatar || '😊'}</span>
                )}
              </div>
            ))}
            {groupMembers.length > 4 && (
              <div className="w-5 h-5 bg-primary-200 rounded-full flex items-center justify-center border-2 border-white text-[7px] text-primary-600 font-semibold shadow-sm">
                +{groupMembers.length - 4}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress Section - Match ChallengeInfoCard layout */}
      <div className="px-6 pt-4 flex flex-col gap-3">
        {/* Commitments Count Badge */}
        {sharedCommitmentsCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-primary-100 text-neutral-700 text-[12px] font-medium leading-[16px] rounded-full whitespace-nowrap flex-shrink-0" style={{ fontFamily: 'Inter, sans-serif' }}>
              {sharedCommitmentsCount} {sharedCommitmentsCount === 1 ? 'commitment' : 'commitments'}
            </span>
          </div>
        )}

        {/* Your Progress */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-primary-600 text-[14px] font-medium leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Your Progress
            </span>
            <div className="flex items-center gap-1">
              <img 
                src="/icons/Calendar/Icon-4.svg" 
                alt="Streak" 
                className="w-4 h-4"
              />
              <span className="text-neutral-700 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                {yourCumulativeDays} days
              </span>
            </div>
          </div>
          {/* Show breakdown by type - Calculate for cumulative */}
          <div className="flex flex-col gap-1.5 text-[12px] text-neutral-600" style={{ fontFamily: 'Inter, sans-serif' }}>
            {dailyCommitments.length > 0 && (
              <div className="flex justify-between items-center">
                <span>Daily:</span>
                <span>{dailyCumulativeDays}/{daysElapsed} completed</span>
              </div>
            )}
            {weeklyCommitments.length > 0 && (
              <div className="flex justify-between items-center">
                <span>Weekly:</span>
                <span>{weeklyCumulativeDays}/{daysElapsed} completed</span>
              </div>
            )}
          </div>
          <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
            <div 
              className="h-2 bg-success-400 rounded-full transition-all"
              style={{ width: `${Math.min(yourProgressPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Group Performance Summary */}
        {groupMembers.length > 0 && (
          <div className="flex flex-col gap-2 pt-1 border-t border-neutral-100">
            <div className="text-neutral-500 text-[12px] font-medium leading-[16px] uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
              Group Performance
            </div>
          <div className="flex justify-between items-center">
              <span className="text-neutral-600 text-[13px] font-normal leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                Group Average
            </span>
            <div className="flex items-center gap-1">
              <img 
                src="/icons/Calendar/Icon-4.svg" 
                alt="Streak" 
                className="w-4 h-4"
              />
              <span className="text-neutral-700 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {groupAverageCumulativeDays} days
              </span>
            </div>
          </div>
            {/* Show breakdown by type */}
            <div className="flex flex-col gap-1.5 text-[12px] text-neutral-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              {dailyCommitments.length > 0 && (
                <div className="flex justify-between items-center">
                  <span>Daily:</span>
                  <span>{dailyCumulativeDays}/{daysElapsed} completed</span>
                </div>
              )}
              {weeklyCommitments.length > 0 && (
                <div className="flex justify-between items-center">
                  <span>Weekly:</span>
                  <span>{weeklyCumulativeDays}/{daysElapsed} completed</span>
                </div>
              )}
            </div>
            <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
            <div 
                className="h-2 bg-primary-500 rounded-full transition-all"
              style={{ width: `${Math.min(groupAveragePercent, 100)}%` }}
            />
          </div>
        </div>
        )}
      </div>

      {/* Invite Button Row - Match ChallengeInfoCard */}
      <div className="px-6 pt-2 pb-4 flex justify-end items-center">
        <button
            onClick={handleShareInvite}
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow flex-shrink-0 bg-alert-400"
          title="Invite people to group"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 6.66667L10 11.6667L5 6.66667M2.5 4.16667H17.5C18.1904 4.16667 18.75 4.72623 18.75 5.41667V14.5833C18.75 15.2738 18.1904 15.8333 17.5 15.8333H2.5C1.80964 15.8333 1.25 15.2738 1.25 14.5833V5.41667C1.25 4.72623 1.80964 4.16667 2.5 4.16667Z" stroke="white" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          </button>
        </div>
    </div>
  );
};

