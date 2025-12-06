'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const EMOJI_OPTIONS = ['😊', '😀', '😎', '🤩', '😍', '🥳', '😇', '🤗', '😋', '😌', '😉', '🙂'];

export default function EditProfilePage() {
  const router = useRouter();
  const [name, setName] = useState('Saloni Rakheja');
  const [avatar, setAvatar] = useState('😊');
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Load saved avatar from localStorage on mount
  useEffect(() => {
    const savedAvatar = localStorage.getItem('userAvatar');
    const savedName = localStorage.getItem('userName');
    const savedAvatarImage = localStorage.getItem('userAvatarImage');
    if (savedAvatar) setAvatar(savedAvatar);
    if (savedName) setName(savedName);
    if (savedAvatarImage) setAvatarImage(savedAvatarImage);
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleAvatarClick = () => {
    // Show emoji picker on click
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleAvatarImageClick = () => {
    // If image is already set, allow changing it directly
    fileInputRef.current?.click();
  };

  const handleEmojiSelect = (emoji: string) => {
    setAvatar(emoji);
    setAvatarImage(null); // Clear image when emoji is selected
    setShowEmojiPicker(false);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Set maximum dimensions (300x300 for avatar)
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = (height * MAX_WIDTH) / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = (width * MAX_HEIGHT) / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress the image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Use JPEG with quality 0.8 for better compression (convert PNG to JPEG)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressedDataUrl);
        };
        img.onerror = () => {
          reject(new Error('Error loading image'));
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      try {
        // Compress the image before setting it
        const compressedImage = await compressImage(file);
        setAvatarImage(compressedImage);
        setAvatar(''); // Clear emoji when image is selected
        setShowEmojiPicker(false);
      } catch (error) {
        console.error('Error compressing image:', error);
        alert('Error processing image. Please try again.');
      }
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Save name and avatar to localStorage
      localStorage.setItem('userName', name);
      localStorage.setItem('userAvatar', avatar);
      if (avatarImage) {
        try {
          localStorage.setItem('userAvatarImage', avatarImage);
        } catch (error) {
          // If quota exceeded, try to compress further or show error
          if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            alert('Image is too large to save. Please try a smaller image or reduce the file size.');
            setIsLoading(false);
            return;
          }
          throw error;
        }
      } else {
        localStorage.removeItem('userAvatarImage');
      }
      
      // Dispatch custom event to update avatar and name in same tab
      // This will trigger GroupsContext to update member info in all groups
      window.dispatchEvent(new CustomEvent('avatarUpdated', { 
        detail: { avatar, avatarImage, name } 
      }));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      router.back();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] min-h-[956px] relative bg-white mx-auto pb-20">
      {/* Header */}
      <div className="px-6 pt-12 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-neutral-50 rounded-full flex justify-center items-center"
        >
          <img 
            src="/icons/Profile/Icon-10.svg" 
            alt="Back" 
            className="w-5 h-5"
          />
        </button>
        <h1 className="text-neutral-700 text-xl font-medium leading-8" style={{ fontFamily: 'Inter, sans-serif' }}>
          Edit Profile
        </h1>
      </div>

      {/* Content */}
      <div className="px-6 pt-8 flex flex-col gap-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4 relative">
          <div 
            className="w-24 h-24 bg-white rounded-full shadow-md flex justify-center items-center cursor-pointer hover:shadow-lg transition-shadow overflow-hidden relative group"
            onClick={avatarImage ? handleAvatarImageClick : handleAvatarClick}
          >
            {avatarImage ? (
              <>
                <img 
                  src={avatarImage} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Change
                  </span>
                </div>
              </>
            ) : (
              <span className="text-neutral-950 text-4xl font-normal leading-10 tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                {avatar}
              </span>
            )}
          </div>
          
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div ref={pickerRef} className="absolute top-32 z-10 bg-white rounded-2xl shadow-lg border-2 border-neutral-50 p-4 w-64">
              <div className="grid grid-cols-4 gap-3">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="w-12 h-12 text-2xl hover:bg-neutral-50 rounded-full transition-colors flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <button
                  onClick={handleImageUpload}
                  className="w-full text-primary-400 text-sm font-medium leading-5 text-center"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Upload Image
                </button>
              </div>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button 
            onClick={handleAvatarClick}
            className="text-primary-400 text-base font-medium leading-6" 
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Change Avatar
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-neutral-700 text-base font-normal leading-6 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
              Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <Button
              onClick={handleSave}
              variant="primary"
              className="w-full"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

