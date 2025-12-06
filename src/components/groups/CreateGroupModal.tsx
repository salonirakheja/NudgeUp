'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (group: { name: string; icon: string; description?: string; challengeDuration?: number }) => void;
}

const groupIcons = [
  '🧘', '💧', '📚', '💪', '🏃', '🥗',
  '😴', '🎨', '✍️', '🎯', '🧠', '☀️',
  '🌙', '🏋️', '🚴', '🧘‍♀️', '🧘‍♂️', '🎵'
];

export const CreateGroupModal = ({ isOpen, onClose, onCreate }: CreateGroupModalProps) => {
  const [selectedIcon, setSelectedIcon] = useState<string>('');
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!groupName.trim() || !selectedIcon) {
      alert('Please select an icon and enter a group name');
      return;
    }

    onCreate({
      name: groupName,
      icon: selectedIcon,
      description: description.trim() || undefined,
      challengeDuration: duration ? parseInt(duration) : undefined,
    });

    // Reset form
    setSelectedIcon('');
    setGroupName('');
    setDescription('');
    setDuration('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-0 overflow-y-auto">
      <div className="w-full max-w-[440px] min-h-[956px] bg-white flex flex-col items-start">
        {/* Header with Back Button */}
        <div className="w-full px-6 pt-12 pb-6 flex items-center gap-4">
          <button
            onClick={onClose}
            className="w-10 h-10 bg-neutral-50 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="#4A5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Create a New Group
          </h2>
        </div>

        {/* Content */}
        <div className="w-full px-6 pb-8 flex flex-col gap-6 overflow-y-auto">
          {/* Title and Subtitle */}
          <div className="flex flex-col gap-2">
            <h1 className="text-neutral-700 text-[24px] font-bold leading-[32px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Start a new challenge together
            </h1>
            <p className="text-neutral-500 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Create a group to track habits with friends and stay accountable
            </p>
          </div>

          {/* Icon Picker */}
          <div className="mt-4">
            <label className="block text-neutral-700 text-[14px] font-medium leading-[20px] mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Pick an icon
            </label>
            <div className="grid grid-cols-6 gap-3">
              {groupIcons.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setSelectedIcon(icon)}
                  className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center text-2xl
                    transition-all
                    ${selectedIcon === icon
                      ? 'bg-primary-400 scale-110 shadow-md'
                      : 'bg-neutral-50 hover:bg-neutral-100'
                    }
                  `}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Group Name Input */}
          <div>
            <label className="block text-neutral-700 text-[14px] font-medium leading-[20px] mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Group name
            </label>
            <Input
              type="text"
              placeholder="e.g., Morning Routine Warriors"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full h-14 px-5 py-4 bg-neutral-50 text-neutral-700 placeholder:text-neutral-400 outline outline-2 outline-offset-[-2px] outline-transparent focus:outline-lime-400"
            />
          </div>

          {/* Description Input (Optional) */}
          <div>
            <label className="block text-neutral-700 text-[14px] font-medium leading-[20px] mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Description (optional)
            </label>
            <textarea
              placeholder="What's this challenge about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-5 py-4 bg-neutral-50 text-neutral-700 placeholder:text-neutral-400 rounded-2xl outline outline-2 outline-offset-[-2px] outline-transparent focus:outline-lime-400 resize-none"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>

          {/* Challenge Duration Input (Optional) */}
          <div>
            <label className="block text-neutral-700 text-[14px] font-medium leading-[20px] mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Challenge duration (optional)
            </label>
            <div className="relative">
              <Input
                type="number"
                placeholder="e.g., 30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full h-14 px-5 py-4 bg-neutral-50 text-neutral-400 placeholder:text-neutral-400 pr-16 outline outline-2 outline-offset-[-2px] outline-transparent"
              />
              <span className="absolute right-5 top-1/2 transform -translate-y-1/2 text-neutral-500 text-[13px] font-medium leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                days
              </span>
            </div>
          </div>

          {/* Create Button */}
          <div className="mt-4">
            <button
              onClick={handleCreate}
              disabled={!groupName.trim() || !selectedIcon}
              className={`
                w-full h-14 rounded-2xl text-[16px] font-normal leading-[24px] transition-colors
                ${groupName.trim() && selectedIcon
                  ? 'bg-primary-400 text-black hover:opacity-90'
                  : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                }
              `}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Create Group
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

