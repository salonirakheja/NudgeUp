'use client';

import { useState } from 'react';

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

interface SendNudgesSectionProps {
  totalMembers?: number;
  pendingMembers?: number;
}

export const SendNudgesSection = ({ totalMembers = 12, pendingMembers = 1 }: SendNudgesSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSendEntireGroup = () => {
    // TODO: Implement send to entire group
    alert(`Sending nudge to all ${totalMembers} members`);
  };

  const handleSendPending = () => {
    // TODO: Implement send to pending members
    alert(`Sending nudge to ${pendingMembers} member(s) who haven't completed today`);
  };

  const handleSendInactive = () => {
    // TODO: Implement send to inactive members
    alert('Sending encouragement to inactive members');
  };

  const handleShare = () => {
    // TODO: Implement share progress functionality
    if (navigator.share) {
      navigator.share({
        title: 'Check out my progress!',
        text: 'I\'m crushing my morning routine challenge!',
      });
    } else {
      alert('Share your progress feature coming soon!');
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
            description={`Send motivation to all ${totalMembers} members`}
            iconBg="bg-success-100"
            iconPath="/icons/nudges/Icon-1.svg"
            sendIconPath="/icons/nudges/Icon-4.svg"
            onSend={handleSendEntireGroup}
          />
          <NudgeCard
            title="Pending Today's Task"
            description={`Nudge ${pendingMembers} member${pendingMembers > 1 ? 's' : ''} who hasn't completed today`}
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

