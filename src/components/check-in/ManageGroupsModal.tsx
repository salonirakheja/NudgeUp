'use client';

import { useState, useEffect } from 'react';
import { Commitment, Group } from '@/types';

interface ManageGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  commitment: Commitment;
  groups: Group[];
  onUpdate: (groupIds: string[]) => void;
}

export function ManageGroupsModal({ isOpen, onClose, commitment, groups, onUpdate }: ManageGroupsModalProps) {
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(commitment.groupIds || []);

  // Reset selected groups when modal opens or commitment changes
  useEffect(() => {
    if (isOpen) {
      setSelectedGroupIds(commitment.groupIds || []);
    }
  }, [isOpen, commitment.groupIds]);

  if (!isOpen) return null;

  const handleToggleGroup = (groupId: string) => {
    if (selectedGroupIds.includes(groupId)) {
      setSelectedGroupIds(selectedGroupIds.filter(id => id !== groupId));
    } else {
      setSelectedGroupIds([...selectedGroupIds, groupId]);
    }
  };

  const handleClearAll = () => {
    setSelectedGroupIds([]);
  };

  const handleDone = () => {
    onUpdate(selectedGroupIds);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />
      
      {/* Bottom Sheet - Compact mobile-native design */}
      <div 
        className="fixed bg-white shadow-2xl z-50 overflow-y-auto bottom-0 md:bottom-6"
        style={{
          maxHeight: '55vh',
          maxWidth: '420px',
          width: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderRadius: '20px 20px 0 0',
        }}
      >
        <div 
          style={{
            padding: '16px 20px',
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center mb-2">
            <div className="w-10 h-1 bg-neutral-300 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
            <h3 className="text-neutral-700 text-[17px] font-semibold leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Manage Groups
            </h3>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4L12 12M12 4L4 12" stroke="#6E6E73" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Clear all button */}
          <button
            onClick={handleClearAll}
            className="w-full text-left text-neutral-500 text-[13px] font-normal hover:bg-neutral-50 rounded-lg transition-colors"
            style={{ 
              fontFamily: 'Inter, sans-serif',
              padding: '10px 0',
              marginBottom: '8px',
            }}
          >
            Clear all groups
          </button>

          {/* Divider */}
          <div className="h-px bg-neutral-200" style={{ marginBottom: '8px' }}></div>

          {/* Groups list - Compact row height */}
          <div className="flex flex-col">
            {groups.map((group) => {
              const isSelected = selectedGroupIds.includes(group.id);
              return (
                <button
                  key={group.id}
                  onClick={() => handleToggleGroup(group.id)}
                  className="w-full flex items-center justify-between hover:bg-neutral-50 transition-colors"
                  style={{ 
                    padding: '10px 0',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span 
                      className="leading-none"
                      style={{ 
                        fontSize: '20px',
                        lineHeight: '1',
                      }}
                    >
                      {group.icon}
                    </span>
                    <span className="text-neutral-700 text-[15px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {group.name}
                    </span>
                  </div>
                  {isSelected && (
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 20 20" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className="flex-shrink-0"
                    >
                      <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#BDC225" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Done button - Compact with side margins */}
          <button
            onClick={handleDone}
            className="bg-[#A6B41F] text-white font-medium hover:opacity-90 transition-opacity text-[15px] flex items-center justify-center"
            style={{ 
              fontFamily: 'Inter, sans-serif',
              height: '46px',
              margin: '16px 16px 12px 16px',
              borderRadius: '23px',
              width: 'calc(100% - 32px)',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}

