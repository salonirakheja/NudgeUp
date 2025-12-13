'use client';

import { useState, useEffect } from 'react';
import { useCommitments } from '@/contexts/CommitmentsContext';
import { useGroups } from '@/contexts/GroupsContext';
import { useAuthContext } from '@/contexts/AuthContext';

export const ProfileCard = () => {
  const { commitments } = useCommitments();
  const { groups } = useGroups();
  const { user } = useAuthContext();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  
  // Get name from user object (from database) or fallback to localStorage
  const name = user?.name || (typeof window !== 'undefined' ? localStorage.getItem('userName') : null) || 'User';
  
  // Format date to "Month YYYY" format
  const formatMemberSince = (timestamp: number | string | undefined): string => {
    if (!timestamp) return 'Recently';
    
    let date: Date;
    if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) return 'Recently';
    
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };
  
  // Get member since from user's createdAt (from database) or fallback to localStorage
  const memberSince = user?.createdAt 
    ? formatMemberSince(user.createdAt) 
    : (typeof window !== 'undefined' && localStorage.getItem('accountCreatedAt') 
      ? formatMemberSince(localStorage.getItem('accountCreatedAt')!) 
      : 'Recently');
  
  // Load saved avatar from localStorage (avatar is not in database yet)
  useEffect(() => {
    const savedAvatar = localStorage.getItem('userAvatar');
    const savedAvatarImage = localStorage.getItem('userAvatarImage');
    
    if (savedAvatar) setAvatar(savedAvatar);
    if (savedAvatarImage) setAvatarImage(savedAvatarImage);
  }, []);

  // Listen for avatar updates (when avatar is updated in edit page)
  useEffect(() => {
    const handleAvatarUpdate = (e: CustomEvent) => {
      if (e.detail?.avatar !== undefined) setAvatar(e.detail.avatar);
      if (e.detail?.avatarImage !== undefined) setAvatarImage(e.detail.avatarImage);
    };

    const handleStorageChange = () => {
      const savedAvatar = localStorage.getItem('userAvatar');
      const savedAvatarImage = localStorage.getItem('userAvatarImage');
      if (savedAvatar) setAvatar(savedAvatar);
      if (savedAvatarImage) setAvatarImage(savedAvatarImage);
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);

    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  return (
    <div 
      className="w-full rounded-2xl shadow-md p-6 flex flex-col gap-5 border border-neutral-100 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(188, 194, 37, 0.02) 0%, rgba(124, 179, 66, 0.03) 100%)',
      }}
    >
      {/* Profile Info */}
      <div className="flex items-center gap-4">
        {/* Avatar - Larger size */}
        <div className="w-16 h-16 bg-white rounded-full shadow-md flex justify-center items-center flex-shrink-0 overflow-hidden border border-neutral-200">
          {avatarImage ? (
            <img 
              src={avatarImage} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : avatar ? (
            <span className="text-neutral-950 text-5xl font-normal leading-none" style={{ fontFamily: 'Inter, sans-serif', padding: '8px' }}>
              {avatar}
            </span>
          ) : (
            <svg 
              className="w-10 h-10 text-neutral-400" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          )}
        </div>

        {/* Name and Stats */}
        <div className="flex-1 flex flex-col gap-2">
          <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            {name}
          </h2>
          <p className="text-neutral-500 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Member since {memberSince}
          </p>
          
          {/* Micro-stats */}
          <div className="flex flex-col gap-1 pt-1">
            <div className="flex items-center">
              <span className="text-neutral-600 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                {commitments.length} Active {commitments.length === 1 ? 'Commitment' : 'Commitments'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-neutral-600 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                {groups.length} {groups.length === 1 ? 'Group' : 'Groups'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

