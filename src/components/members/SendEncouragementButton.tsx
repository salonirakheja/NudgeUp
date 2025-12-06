'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';

export const SendEncouragementButton = () => {
  const params = useParams();
  const groupId = params.id as string;
  const memberId = params.memberId as string;
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    try {
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
      
      // Save encouragement record
      const encouragement = {
        id: `${Date.now()}-${memberId}-encouragement`,
        groupId,
        memberId,
        type: 'encouragement',
        timestamp: now,
      };
      
      if (typeof window !== 'undefined') {
        nudges.push(encouragement);
        localStorage.setItem(STORAGE_KEY_NUDGES, JSON.stringify(nudges));
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      alert('Encouragement sent! 💪');
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

