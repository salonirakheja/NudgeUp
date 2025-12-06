'use client';

import { useState, useEffect } from 'react';
import { Logo } from '@/components/ui/Logo';

export const Header = () => {
  const [avatar, setAvatar] = useState('😊');
  const [avatarImage, setAvatarImage] = useState<string | null>(null);

  // Load saved avatar from localStorage
  useEffect(() => {
    const savedAvatar = localStorage.getItem('userAvatar');
    const savedAvatarImage = localStorage.getItem('userAvatarImage');
    if (savedAvatar) setAvatar(savedAvatar);
    if (savedAvatarImage) setAvatarImage(savedAvatarImage);
  }, []);

  // Listen for avatar updates
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
    <div className="w-full h-14 px-6 flex items-center justify-between relative">
      {/* Empty space for centering */}
      <div className="w-6 h-6"></div>

      {/* Logo - centered */}
      <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
        <Logo />
      </div>

      {/* Profile picture - right side */}
      <div className="flex items-center">
        <div className="w-7 h-7 bg-white rounded-full shadow-md flex justify-center items-center overflow-hidden">
          {avatarImage ? (
            <img 
              src={avatarImage} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-neutral-950 text-lg font-normal leading-6" style={{ fontFamily: 'Inter, sans-serif' }}>
              {avatar}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

