'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCommitments } from '@/contexts/CommitmentsContext';

interface NudgeCardProps {
  title: string;
  description: string;
  iconBg: string;
  iconPath: string;
  sendIconPath: string;
  onSend: () => void;
}

const NudgeCard = ({ title, description, iconBg, iconPath, sendIconPath, onSend }: NudgeCardProps) => {
  return (
    <div className="w-full bg-white rounded-2xl shadow-md p-4 flex items-center gap-4">
      {/* Icon */}
      <div className={`w-12 h-12 ${iconBg} rounded-full flex justify-center items-center flex-shrink-0`}>
        <img src={iconPath} alt={title} className="w-6 h-6" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-1">
        <h4 className="text-neutral-700 text-[16px] font-normal leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          {title}
        </h4>
        <p className="text-neutral-500 text-[13px] font-medium leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          {description}
        </p>
      </div>

      {/* Send Icon */}
      <button
        onClick={onSend}
        className="w-10 h-10 flex justify-center items-center flex-shrink-0"
      >
        <img src={sendIconPath} alt="Send" className="w-5 h-5" />
      </button>
    </div>
  );
};

interface Member {
  id: string;
  name: string;
  avatar: string;
  completedToday: boolean;
  streak: number;
  commitmentCompletions?: { [commitmentId: string]: boolean };
}

interface SendNudgesSectionProps {
  groupId: string;
  groupName: string;
  inviteCode?: string;
  members: Member[];
  totalMembers?: number;
  pendingMembers?: number;
}

interface NudgeRecord {
  id: string;
  groupId: string;
  memberId?: string;
  commitmentId?: string;
  type: 'entire_group' | 'pending' | 'inactive' | 'individual' | 'encouragement';
  timestamp: number;
}

const STORAGE_KEY_NUDGES = 'nudgeup_nudges';

const getNudges = (): NudgeRecord[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY_NUDGES);
  return stored ? JSON.parse(stored) : [];
};

const saveNudge = (nudge: NudgeRecord) => {
  const nudges = getNudges();
  nudges.push(nudge);
  localStorage.setItem(STORAGE_KEY_NUDGES, JSON.stringify(nudges));
};

const canNudge = (groupId: string, memberId?: string, type: string = 'individual'): boolean => {
  const nudges = getNudges();
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  // Check if we've nudged this recipient in the last hour
  const recentNudge = nudges.find(n => {
    if (type === 'entire_group') {
      return n.groupId === groupId && n.type === 'entire_group' && (now - n.timestamp) < oneHour;
    }
    return n.groupId === groupId && n.memberId === memberId && (now - n.timestamp) < oneHour;
  });
  
  return !recentNudge;
};

export const SendNudgesSection = ({ groupId, groupName, inviteCode, members, totalMembers, pendingMembers }: SendNudgesSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSending, setIsSending] = useState<string | null>(null);
  const params = useParams();
  const { commitments, completions } = useCommitments();
  
  // Calculate actual pending and inactive members
  const todayObj = new Date();
  const todayYear = todayObj.getFullYear();
  const todayMonth = todayObj.getMonth() + 1;
  const todayDay = todayObj.getDate();
  const today = `${todayYear}-${String(todayMonth).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
  
  const actualPendingMembers = members.filter(m => !m.completedToday && m.id !== 'current-user');
  const actualPendingCount = actualPendingMembers.length;
  
  // Calculate inactive members (3+ days without completion)
  const inactiveMembers = members.filter(member => {
    if (member.id === 'current-user') return false;
    // For now, we'll use streak as a proxy - if streak is 0, they might be inactive
    // In a real app, we'd check last completion date
    return member.streak === 0;
  });
  const inactiveCount = inactiveMembers.length;
  
  const actualTotalMembers = members.length;

  const handleSendEntireGroup = async () => {
    if (!canNudge(groupId, undefined, 'entire_group')) {
      alert('Please wait at least 1 hour before nudging the entire group again.');
      return;
    }
    
    setIsSending('entire_group');
    try {
      const nudge: NudgeRecord = {
        id: Date.now().toString(),
        groupId,
        type: 'entire_group',
        timestamp: Date.now(),
      };
      saveNudge(nudge);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      alert(`Nudge sent to all ${actualTotalMembers} members!`);
    } catch (error) {
      console.error('Error sending nudge:', error);
      alert('Failed to send nudge. Please try again.');
    } finally {
      setIsSending(null);
    }
  };

  const handleSendPending = async () => {
    if (actualPendingCount === 0) {
      alert('No pending members to nudge.');
      return;
    }
    
    setIsSending('pending');
    try {
      const nudges: NudgeRecord[] = actualPendingMembers.map(member => ({
        id: `${Date.now()}-${member.id}`,
        groupId,
        memberId: member.id,
        type: 'pending',
        timestamp: Date.now(),
      }));
      
      nudges.forEach(nudge => {
        if (canNudge(groupId, nudge.memberId, 'pending')) {
          saveNudge(nudge);
        }
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      alert(`Nudge sent to ${actualPendingCount} pending member(s)!`);
    } catch (error) {
      console.error('Error sending nudge:', error);
      alert('Failed to send nudge. Please try again.');
    } finally {
      setIsSending(null);
    }
  };

  const handleSendInactive = async () => {
    if (inactiveCount === 0) {
      alert('No inactive members to nudge.');
      return;
    }
    
    setIsSending('inactive');
    try {
      const nudges: NudgeRecord[] = inactiveMembers.map(member => ({
        id: `${Date.now()}-${member.id}`,
        groupId,
        memberId: member.id,
        type: 'inactive',
        timestamp: Date.now(),
      }));
      
      nudges.forEach(nudge => {
        if (canNudge(groupId, nudge.memberId, 'inactive')) {
          saveNudge(nudge);
        }
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      alert(`Encouragement sent to ${inactiveCount} inactive member(s)!`);
    } catch (error) {
      console.error('Error sending nudge:', error);
      alert('Failed to send encouragement. Please try again.');
    } finally {
      setIsSending(null);
    }
  };

  const handleShare = async () => {
    // Get user's progress
    const sharedCommitments = commitments.filter(c => c.groupIds?.includes(groupId));
    const completedToday = sharedCommitments.filter(c => {
      const completion = completions.find(
        comp => comp.commitmentId === c.id && comp.date === today && comp.completed
      );
      return completion?.completed || false;
    }).length;
    
    const shareText = `I've completed ${completedToday}/${sharedCommitments.length} commitments in ${groupName}! 🎉\n\nJoin me: ${inviteCode || 'Use invite code to join'}`;
    const shareUrl = inviteCode ? `https://nudgeup.app/join/${inviteCode}` : '';
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out my progress!',
          text: shareText,
          url: shareUrl,
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
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
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
    <div className="w-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-neutral-700 text-[18px] font-semibold leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          Send Nudges
        </h3>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-10 h-10 bg-neutral-50 rounded-full flex justify-center items-center"
        >
          {isExpanded ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12.5L10 7.5L15 12.5" stroke="#4A5568" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 7.5L10 12.5L15 7.5" stroke="#4A5568" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>

      {/* Nudge Cards */}
      {isExpanded && (
        <div className="flex flex-col gap-3">
          <NudgeCard
            title="Entire Group"
            description={`Send motivation to all ${actualTotalMembers} members`}
            iconBg="bg-success-100"
            iconPath="/icons/nudges/Icon-1.svg"
            sendIconPath="/icons/nudges/Icon-4.svg"
            onSend={handleSendEntireGroup}
          />
          <NudgeCard
            title="Pending Today's Task"
            description={`Nudge ${actualPendingCount} member${actualPendingCount !== 1 ? 's' : ''} who hasn't completed today`}
            iconBg="bg-orange-100"
            iconPath="/icons/nudges/Icon-2.svg"
            sendIconPath="/icons/nudges/Icon-5.svg"
            onSend={handleSendPending}
          />
          <NudgeCard
            title="Inactive 3+ Days"
            description="Encourage inactive members"
            iconBg="bg-success-100"
            iconPath="/icons/nudges/Icon-3.svg"
            sendIconPath="/icons/nudges/Icon-6.svg"
            onSend={handleSendInactive}
          />
        </div>
      )}

      {/* Share Your Progress Button - Always visible */}
      <button
        onClick={handleShare}
        className="w-full h-14 bg-primary-500 rounded-2xl shadow-lg text-white text-[16px] font-normal leading-[24px] hover:opacity-90 transition-opacity"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        Share Your Progress
      </button>
    </div>
  );
};

