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
            className="w-5 h-5 bg-white rounded-full flex items-center justify-center border-2 border-alert-400 shadow-sm"
            style={{ zIndex: displayMembers.length - index }}
            title={member.name}
          >
            <span className="text-[10px]">{member.avatar}</span>
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
  const { commitments, completions, getCommitmentStreak } = useCommitments();
  const { getGroupMembers } = useGroups();
  
  // Get commitments shared with this group (where groupIds array includes this group's id)
  const sharedCommitments = commitments.filter(c => c.groupIds?.includes(group.id));
  const sharedCommitmentsCount = sharedCommitments.length;

  // Calculate actual progress based on completed commitments today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const completedCommitmentsToday = sharedCommitments.filter(commitment => {
    const completion = completions.find(
      c => c.commitmentId === commitment.id && c.date === todayStr && c.completed
    );
    return completion?.completed || false;
  }).length;
  
  // Calculate progress percentage: completed commitments / total shared commitments
  const yourProgressPercent = sharedCommitmentsCount > 0 
    ? Math.round((completedCommitmentsToday / sharedCommitmentsCount) * 100)
    : 0;
  
  // Get group members
  const groupMembers = getGroupMembers(group.id);
  const otherMembers = groupMembers.filter(m => m.id !== 'current-user');
  const totalOtherMembers = otherMembers.length;
  
  // Calculate group average from all members (mock calculation for now)
  // In real app, would calculate from actual member completions
  const groupAveragePercent = yourProgressPercent;
  const groupAverageCount = completedCommitmentsToday;
  
  // Determine status message based on progress comparison
  const pendingCount = sharedCommitmentsCount - completedCommitmentsToday;
  let statusMessage = '';
  let showStatus = false;
  if (sharedCommitmentsCount > 0) {
    if (completedCommitmentsToday > groupAverageCount) {
      statusMessage = "You're ahead of the group! 🎉";
      showStatus = true;
    } else if (completedCommitmentsToday === groupAverageCount) {
      statusMessage = `Today: ${completedCommitmentsToday} completed · ${pendingCount} pending`;
      showStatus = true;
    } else if (completedCommitmentsToday < groupAverageCount) {
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

  const handleShareInvite = () => {
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
    const progressText = `I've completed ${completedCommitmentsToday}/${sharedCommitmentsCount} commitments in ${group.name}! Join me: ${inviteLink}`;
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
                className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                style={{ zIndex: displayMembers.length - index }}
                title={member.name}
              >
                <span className="text-[9px]">{member.avatar}</span>
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

      {/* Progress Section - Tighter spacing */}
      <div className="px-6 pt-2.5 flex flex-col gap-2.5">
        {/* Your Progress */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-neutral-700 text-[14px] font-medium leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Your Progress
            </span>
            <div className="flex items-center gap-1">
              {/* Green fire icon from home page */}
              <img 
                src="/icons/Calendar/Icon-4.svg" 
                alt="Streak" 
                className="w-3.5 h-3.5"
              />
              <span className="text-neutral-700 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                {completedCommitmentsToday}
              </span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div 
              className="h-1.5 bg-[#BDC225] rounded-full transition-all"
              style={{ width: `${Math.min(yourProgressPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Group Average */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-neutral-700 text-[14px] font-medium leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Group Avg
            </span>
            <div className="flex items-center gap-1">
              {/* Green fire icon from home page */}
              <img 
                src="/icons/Calendar/Icon-4.svg" 
                alt="Streak" 
                className="w-3.5 h-3.5"
              />
              <span className="text-neutral-700 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                {groupAverageCount}
              </span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div 
              className="h-1.5 bg-[#BDC225] rounded-full transition-all"
              style={{ width: `${Math.min(groupAveragePercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Status Message Banner with Friend Pill - Clean text-only style */}
      {showStatus && (
        <div className="px-6 pt-1.5 pb-3 flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            {statusMessage.includes('Today:') ? (
              <span className="text-neutral-600 text-[13px] font-normal leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                <span className="font-semibold">Today:</span> <span className="font-semibold text-neutral-700">{completedCommitmentsToday}</span> completed · <span className="text-neutral-500">{pendingCount}</span> pending
              </span>
            ) : (
              <span className="text-neutral-600 text-[13px] font-normal leading-[18px] truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                {statusMessage}
              </span>
            )}
          </div>
          <FriendPill
            members={otherMembers.slice(0, 2)}
            totalCount={totalOtherMembers}
            onClick={handleShareInvite}
          />
        </div>
      )}

      {/* Share Progress Button - Text-only, reduced height, softer green */}
      {sharedCommitmentsCount > 0 && (
        <div className="px-6 pt-3 pb-3.5">
          <button
            onClick={handleShareProgress}
            className="w-full h-7 bg-[#BDC225] text-white rounded-full font-medium hover:opacity-90 transition-opacity flex items-center justify-center"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <span className="text-[13px] font-medium">Share Progress</span>
          </button>
        </div>
      )}

      {/* Context Lines - Subtle divider above footer */}
      {contextLines.length > 0 && (
        <>
          <div className="mx-6 h-px bg-neutral-100"></div>
          <div className="px-6 pb-3.5 pt-2.5 flex flex-col gap-1.5">
            {contextLines.map((line, index) => (
              <span 
                key={index}
                className="text-neutral-500 text-[12px] font-normal leading-[16px]" 
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {line}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

