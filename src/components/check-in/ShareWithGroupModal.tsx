'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface Group {
  id: string;
  name: string;
  icon: string;
}

interface ShareWithGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (groupId: string) => void;
  commitmentName: string;
  groups: Group[];
}

export const ShareWithGroupModal = ({ 
  isOpen, 
  onClose, 
  onShare, 
  commitmentName,
  groups 
}: ShareWithGroupModalProps) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  if (!isOpen) return null;

  const handleShare = () => {
    if (!selectedGroupId) {
      alert('Please select a group to share with');
      return;
    }
    onShare(selectedGroupId);
    setSelectedGroupId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-lg flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            Share "{commitmentName}" with Group
          </h2>
          <p className="text-neutral-500 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Select a group to share this commitment with
          </p>
        </div>

        {/* Groups List */}
        <div className="px-6 pb-4 flex flex-col gap-2 max-h-64 overflow-y-auto">
          {groups.length === 0 ? (
            <p className="text-neutral-500 text-[14px] font-normal leading-[20px] text-center py-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              You're not part of any groups yet. Join a group first!
            </p>
          ) : (
            groups.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`
                  w-full px-4 py-3 rounded-2xl border-2 transition-all text-left
                  ${selectedGroupId === group.id
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-50 rounded-xl flex items-center justify-center">
                    <span className="text-xl">{group.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-neutral-700 text-[16px] font-normal leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {group.name}
                    </div>
                  </div>
                  {selectedGroupId === group.id && (
                    <div className="w-5 h-5 bg-primary-400 rounded-full flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 pt-4 flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleShare}
            disabled={!selectedGroupId || groups.length === 0}
            className="flex-1"
          >
            Share
          </Button>
        </div>
      </div>
    </div>
  );
};

