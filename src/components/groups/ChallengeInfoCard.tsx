'use client';

import { useParams } from 'next/navigation';
import { useCommitments } from '@/contexts/CommitmentsContext';
import { useGroups } from '@/contexts/GroupsContext';

interface Group {
  id: string;
  challengeDuration?: string;
  yourProgress: number;
  totalDays?: number;
  inviteCode?: string;
}

interface Member {
  id: string;
  name: string;
  avatar: string;
  completedToday: boolean;
  commitmentCompletions?: { [commitmentId: string]: boolean };
}

interface ChallengeInfoCardProps {
  group: Group;
  members?: Member[];
}

export const ChallengeInfoCard = ({ group, members = [] }: ChallengeInfoCardProps) => {
  const params = useParams();
  const groupId = params.id as string;
  const { commitments, completions, getCompletionForDate } = useCommitments();
  const { groups } = useGroups();
  
  // Get commitments shared with this group (where groupIds array includes this group's id)
  const sharedCommitments = commitments.filter(c => c.groupIds?.includes(groupId));
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
  
  // Calculate progress: completed commitments / total shared commitments
  const actualProgress = sharedCommitmentsCount > 0 
    ? Math.round((completedCommitmentsToday / sharedCommitmentsCount) * 100)
    : 0;

  // Calculate group average completion
  const getMemberCompletionCount = (memberId: string) => {
    if (memberId === 'current-user') {
      return completedCommitmentsToday;
    }
    const member = members.find(m => m.id === memberId);
    if (!member) return 0;
    return sharedCommitments.filter(commitment => 
      member.commitmentCompletions?.[commitment.id] || false
    ).length;
  };

  const totalMemberCompletions = members.reduce((sum, member) => 
    sum + getMemberCompletionCount(member.id), 0
  );
  const groupAverageCount = members.length > 0 
    ? Math.round(totalMemberCompletions / members.length) 
    : 0;
  const groupAveragePercent = sharedCommitmentsCount > 0
    ? Math.round((groupAverageCount / sharedCommitmentsCount) * 100)
    : 0;
  
  // Get invite code
  const currentGroup = groups.find(g => g.id === groupId) || group;
  const inviteCode = currentGroup.inviteCode || `GRP${groupId.padStart(3, '0')}`;
  const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${inviteCode}`;

  const progressPercent = actualProgress;

  const handleShareInvite = () => {
    if (navigator.share) {
      navigator.share({
        title: `Join ${group.name || 'this group'}`,
        text: `Join me in this challenge! Use code: ${inviteCode}`,
        url: inviteLink,
      });
    } else {
      navigator.clipboard.writeText(inviteLink);
      alert(`Invite link copied to clipboard!\nCode: ${inviteCode}\nLink: ${inviteLink}`);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-md p-4 flex flex-col gap-3 border border-neutral-100">
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
              src="/icons/Groups Page/Icon-1.svg" 
              alt="Flame" 
              className="w-4 h-4"
            />
            <span className="text-neutral-700 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              {completedCommitmentsToday}/{sharedCommitmentsCount}
            </span>
          </div>
        </div>
        <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
          <div 
            className="h-2 bg-success-400 rounded-full transition-all"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Group Performance Summary */}
      {members.length > 0 && (
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
                src="/icons/Groups Page/Icon-4.svg" 
                alt="Group" 
                className="w-4 h-4"
              />
              <span className="text-neutral-700 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                {groupAverageCount}/{sharedCommitmentsCount}
              </span>
            </div>
          </div>
          <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
            <div 
              className="h-2 bg-primary-500 rounded-full transition-all"
              style={{ width: `${Math.min(groupAveragePercent, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Invite Button Row */}
      <div className="flex justify-end items-center pt-2">
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

