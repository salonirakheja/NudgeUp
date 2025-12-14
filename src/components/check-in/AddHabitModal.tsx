'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGroups } from '@/contexts/GroupsContext';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (commitment: { name: string; icon: string; duration?: number; frequencyType?: 'daily' | 'weekly'; timesPerWeek?: number; groupIds?: string[] }) => void;
}

const habitIcons = [
  '🧘', '💧', '📚', '💪', '🏃', '🥗',
  '😴', '🎨', '✍️', '🎯', '🧠', '☀️',
];


export const AddHabitModal = ({ isOpen, onClose, onSave }: AddHabitModalProps) => {
  const { groups, createGroup } = useGroups();
  const [selectedIcon, setSelectedIcon] = useState<string>('');
  const [commitmentName, setCommitmentName] = useState('');
  const [duration, setDuration] = useState('');
  const [showCustomIconInput, setShowCustomIconInput] = useState(false);
  const [customIcon, setCustomIcon] = useState<string>('');
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly'>('daily');
  const [timesPerWeek, setTimesPerWeek] = useState<string>('3');
  const [groupOption, setGroupOption] = useState<'none' | 'existing' | 'new'>('none');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupId, setNewGroupId] = useState<string>('');

  if (!isOpen) return null;

  const handleCreateGroup = (groupData: { name: string; icon: string; description?: string; challengeDuration?: number }) => {
    const newGroup = createGroup({
      name: groupData.name,
      icon: groupData.icon,
      description: groupData.description,
      totalDays: groupData.challengeDuration,
    });
    setNewGroupId(newGroup.id);
    setShowCreateGroupModal(false);
    // Automatically select the newly created group
    setGroupOption('existing');
    setSelectedGroupId(newGroup.id);
  };

  const handleSave = () => {
    if (!commitmentName.trim() || !selectedIcon) {
      alert('Please select an icon and enter a commitment name');
      return;
    }

    // Validate timesPerWeek if weekly
    if (frequencyType === 'weekly') {
      const times = parseInt(timesPerWeek);
      if (isNaN(times) || times < 1 || times > 7) {
        alert('Times per week must be between 1 and 7');
        return;
      }
    }

    // Validate group selection
    let groupIds: string[] | undefined = undefined;
    if (groupOption === 'existing') {
      if (!selectedGroupId) {
        alert('Please select a group');
        return;
      }
      groupIds = [selectedGroupId];
    } else if (groupOption === 'new') {
      if (!newGroupId) {
        // If user selected "new" but hasn't created a group yet, don't block them
        // They can create the commitment without a group
        groupIds = undefined;
      } else {
        groupIds = [newGroupId];
      }
    }

    onSave({
      name: commitmentName,
      icon: selectedIcon,
      duration: duration ? parseInt(duration) : undefined,
      frequencyType: frequencyType,
      timesPerWeek: frequencyType === 'weekly' ? parseInt(timesPerWeek) : undefined,
      groupIds: groupIds,
    });

    // Reset form
    setSelectedIcon('');
    setCommitmentName('');
    setDuration('');
    setShowCustomIconInput(false);
    setCustomIcon('');
    setFrequencyType('daily');
    setTimesPerWeek('3');
    setGroupOption('none');
    setSelectedGroupId('');
    setNewGroupId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-0 overflow-y-auto">
      <div className="w-full max-w-[440px] min-h-[956px] bg-white relative flex flex-col">
        {/* Header */}
        <div className="w-full px-5 pt-6 pb-4 flex-shrink-0">
          {/* Back button */}
          <button
            onClick={onClose}
            className="w-10 h-10 bg-neutral-50 rounded-full inline-flex justify-center items-center mb-4"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.5 5L7.5 10L12.5 15" stroke="#4A5568" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Title */}
          <h1 className="text-neutral-700 text-[24px] font-bold leading-[32px] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            Create New Commitment
          </h1>

          {/* Subtitle */}
          <p className="text-neutral-500 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Start a new journey today ✨
          </p>
        </div>

        {/* Icon Picker Section */}
        <div className="px-5 mt-6 flex-shrink-0">
          <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px] mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            Pick an icon
          </h2>

          {!showCustomIconInput ? (
            <div className="grid grid-cols-6 gap-[18.66px]">
              {habitIcons.map((icon, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIcon(icon)}
                  className={`
                    rounded-2xl inline-flex justify-center items-center transition-all
                    ${selectedIcon === icon
                      ? 'bg-primary-100 shadow-[0px_0px_0px_2px_rgba(124,179,66,1.00)] w-16 h-16'
                      : 'bg-neutral-50 hover:bg-neutral-100 w-14 h-14'
                    }
                  `}
                >
                  <span className="text-neutral-950 text-2xl font-normal leading-8 tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {icon}
                  </span>
                </button>
              ))}
              
              {/* Add Custom Icon Button */}
              <button
                onClick={() => setShowCustomIconInput(true)}
                className={`
                  rounded-2xl inline-flex justify-center items-center transition-all
                  bg-neutral-50 hover:bg-neutral-100 w-14 h-14
                `}
              >
                <span className="text-neutral-950 text-2xl font-normal leading-8 tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                  +
                </span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Enter emoji or text (e.g., 🎸 or ABC)"
                  value={customIcon}
                  onChange={(e) => setCustomIcon(e.target.value)}
                  className="flex-1 h-12 px-4 py-3 bg-neutral-50 text-neutral-700 placeholder:text-neutral-400 text-[16px] font-normal leading-[24px] rounded-xl border border-neutral-200"
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (customIcon.trim()) {
                      setSelectedIcon(customIcon.trim());
                      setShowCustomIconInput(false);
                      setCustomIcon('');
                    }
                  }}
                  className="px-4 h-12 bg-primary-400 text-black rounded-xl font-medium hover:opacity-90 transition-opacity"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowCustomIconInput(false);
                    setCustomIcon('');
                  }}
                  className="px-4 h-12 bg-neutral-200 text-neutral-700 rounded-xl font-medium hover:bg-neutral-300 transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Cancel
                </button>
              </div>
              {customIcon && (
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-neutral-500 leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Preview:
                  </span>
                  <div className="w-14 h-14 bg-neutral-50 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">{customIcon}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Habit Name Input */}
        <div className="px-5 mt-12 flex-shrink-0">
          <label className="block text-neutral-700 text-[14px] font-medium leading-[20px] mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              What's your commitment?
          </label>
          <Input
            type="text"
            placeholder="e.g., Morning walk"
            value={commitmentName}
            onChange={(e) => setCommitmentName(e.target.value)}
            className="w-full h-14 px-5 py-4 bg-neutral-50 text-neutral-700 placeholder:text-neutral-400 outline outline-2 outline-offset-[-2px] outline-transparent"
          />
        </div>

        {/* Frequency Type Selection */}
        <div className="px-5 mt-12 flex-shrink-0">
          <label className="block text-neutral-700 text-[14px] font-medium leading-[20px] mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            Frequency
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFrequencyType('daily')}
              className={`
                flex-1 h-14 rounded-xl font-medium transition-all
                ${frequencyType === 'daily'
                  ? 'bg-primary-400 text-black'
                  : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                }
              `}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => setFrequencyType('weekly')}
              className={`
                flex-1 h-14 rounded-xl font-medium transition-all
                ${frequencyType === 'weekly'
                  ? 'bg-primary-400 text-black'
                  : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                }
              `}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Weekly
            </button>
          </div>
        </div>

        {/* Times Per Week Input (only shown for weekly) */}
        {frequencyType === 'weekly' && (
          <div className="px-5 mt-6 flex-shrink-0">
            <label className="block text-neutral-700 text-[14px] font-medium leading-[20px] mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              How many times per week?
            </label>
            <div className="relative">
              <Input
                type="number"
                min="1"
                max="7"
                placeholder="e.g., 3"
                value={timesPerWeek}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 7)) {
                    setTimesPerWeek(value);
                  }
                }}
                className="w-full h-14 px-5 py-4 bg-neutral-50 text-neutral-700 placeholder:text-neutral-400 outline outline-2 outline-offset-[-2px] outline-transparent"
              />
            </div>
          </div>
        )}

        {/* Challenge Duration Input */}
        <div className="px-5 mt-12 flex-shrink-0">
          <label className="block text-neutral-700 text-[14px] font-medium leading-[20px] mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            Challenge duration (optional)
          </label>
          <div className="relative">
            <Input
              type="number"
              placeholder="e.g., 30"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full h-14 px-5 py-4 bg-neutral-50 text-neutral-700 placeholder:text-neutral-400 pr-16 outline outline-2 outline-offset-[-2px] outline-transparent"
            />
            <span className="absolute right-5 top-1/2 transform -translate-y-1/2 text-neutral-500 text-[13px] font-medium leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              days
            </span>
          </div>
        </div>

        {/* Group Selection */}
        <div className="px-5 mt-12 flex-shrink-0">
          <label className="block text-neutral-700 text-[14px] font-medium leading-[20px] mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            Add to a group (optional)
          </label>
          <div className="flex flex-col gap-3">
            {/* None option */}
            <button
              type="button"
              onClick={() => {
                setGroupOption('none');
                setSelectedGroupId('');
                setNewGroupId('');
              }}
              className={`
                w-full h-14 rounded-xl font-medium transition-all text-left px-5
                ${groupOption === 'none'
                  ? 'bg-primary-400 text-black'
                  : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                }
              `}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              No group
            </button>

            {/* Existing group option */}
            {groups.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setGroupOption('existing')}
                  className={`
                    w-full h-14 rounded-xl font-medium transition-all text-left px-5
                    ${groupOption === 'existing'
                      ? 'bg-primary-400 text-black'
                      : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                    }
                  `}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Add to existing group
                </button>
                {groupOption === 'existing' && (
                  <div className="mt-2 pl-2">
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="w-full h-12 px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-neutral-700 text-[14px] font-normal"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      <option value="">Select a group...</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.icon} {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {/* New group option */}
            <button
              type="button"
              onClick={() => {
                setGroupOption('new');
                setShowCreateGroupModal(true);
              }}
              className={`
                w-full h-14 rounded-xl font-medium transition-all text-left px-5
                ${groupOption === 'new'
                  ? 'bg-primary-400 text-black'
                  : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                }
              `}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Create new group
            </button>
            {groupOption === 'new' && newGroupId && (
              <div className="mt-2 pl-2">
                <div className="px-4 py-2 bg-primary-50 rounded-xl text-primary-700 text-[13px] font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                  ✓ Group created! This commitment will be added to it.
                </div>
              </div>
            )}
          </div>
        </div>


        {/* Pro Tip Section */}
        <div className="px-5 mt-12 mb-8 flex-shrink-0">
          <div className="bg-neutral-50 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <p className="text-neutral-700 text-base font-semibold leading-6 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Pro tip
                </p>
                <p className="text-neutral-500 text-sm font-normal leading-5" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Start small! Consistency beats intensity. Even 5 minutes a day can build powerful commitments.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="px-5 mb-8 flex-shrink-0">
          <button
            onClick={handleSave}
                disabled={!commitmentName.trim() || !selectedIcon}
                className={`
                  w-full h-14 rounded-2xl text-base font-medium leading-6 transition-colors
                  ${commitmentName.trim() && selectedIcon
                    ? 'bg-primary-400 text-black hover:opacity-90'
                    : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  }
                `}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Create Commitment
          </button>
        </div>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => {
          setShowCreateGroupModal(false);
          // If user closes without creating, reset to 'none'
          if (!newGroupId) {
            setGroupOption('none');
          }
        }}
        onCreate={handleCreateGroup}
      />
    </div>
  );
};

