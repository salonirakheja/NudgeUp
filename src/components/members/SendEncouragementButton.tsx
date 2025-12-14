'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCommitments } from '@/contexts/CommitmentsContext';
import { useGroups } from '@/contexts/GroupsContext';
import { tx, id, db } from '@/lib/instant';

export const SendEncouragementButton = () => {
  const params = useParams();
  const groupId = params.id as string;
  const memberId = params.memberId as string;
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuthContext();
  const { commitments } = useCommitments();
  const { getGroupMembers } = useGroups();
  const currentUserId = user?.id || 'anonymous';

  const handleSend = async () => {
    setIsSending(true);
    try {
      if (currentUserId === 'anonymous') {
        alert('Please sign in to send encouragement.');
        setIsSending(false);
        return;
      }

      // Get shared commitments for this group
      const sharedCommitments = commitments.filter(c => c.groupIds?.includes(groupId));
      
      if (sharedCommitments.length === 0) {
        alert('No shared commitments in this group to send encouragement about.');
        setIsSending(false);
        return;
      }

      // Get actual member ID
      const actualMemberId = memberId === 'current-user' ? currentUserId : memberId;
      if (actualMemberId === 'anonymous' || actualMemberId === currentUserId) {
        alert('Unable to send encouragement: Invalid recipient.');
        setIsSending(false);
        return;
      }

      // Check if we can send encouragement (prevent spam)
      const STORAGE_KEY_NUDGES = 'nudgeup_nudges';
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_NUDGES) : null;
      const nudges = stored ? JSON.parse(stored) : [];
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      const recentNudge = nudges.find((n: any) => 
        n.groupId === groupId && 
        n.memberId === memberId && 
        n.type === 'encouragement' &&
        (now - n.timestamp) < oneHour
      );
      
      if (recentNudge) {
        alert('Please wait at least 1 hour before sending encouragement again.');
        setIsSending(false);
        return;
      }
      
      // Create nudges in InstantDB for each shared commitment
      let nudgeCount = 0;
      for (const commitment of sharedCommitments) {
        try {
          const nudgeId = id();
          const nudgeData = {
            toUserId: actualMemberId,
            fromUserId: currentUserId,
            habitId: commitment.id,
            groupId,
            createdAt: now,
            resolvedAt: null,
          };
          
          await db.transact(tx.nudges[nudgeId].update(nudgeData));
          nudgeCount++;
          console.log('✅ Created encouragement nudge:', { nudgeId, ...nudgeData });
        } catch (error) {
          console.error(`❌ Error creating encouragement nudge for commitment ${commitment.id}:`, error);
        }
      }
      
      // Also save encouragement record to localStorage for rate limiting
      const encouragement = {
        id: `${now}-${memberId}-encouragement`,
        groupId,
        memberId,
        type: 'encouragement',
        timestamp: now,
      };
      
      if (typeof window !== 'undefined') {
        nudges.push(encouragement);
        localStorage.setItem(STORAGE_KEY_NUDGES, JSON.stringify(nudges));
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      alert(`Encouragement sent! 💪`);
    } catch (error) {
      console.error('Error sending encouragement:', error);
      alert('Failed to send encouragement. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <button
      onClick={handleSend}
      disabled={isSending}
      className="w-full h-14 bg-primary-500 rounded-2xl shadow-lg text-white text-[16px] font-normal leading-[24px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {isSending ? 'Sending...' : 'Send Encouragement'}
    </button>
  );
};

