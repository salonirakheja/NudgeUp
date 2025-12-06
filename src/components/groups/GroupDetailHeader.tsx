'use client';

import { useState, useEffect } from 'react';
import { Group, GroupMember } from '@/types';

interface GroupDetailHeaderProps {
  group: Group;
  members?: GroupMember[];
  onBack: () => void;
  onDelete?: () => void;
}

export const GroupDetailHeader = ({ group, members = [], onBack, onDelete }: GroupDetailHeaderProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete();
    }
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="w-full px-6 pt-12 pb-4">
      {/* Back Button and Delete Button */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onBack}
          className="w-10 h-10 bg-neutral-50 rounded-full inline-flex justify-center items-center"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.5 5L7.5 10L12.5 15" stroke="#4A5568" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {onDelete && (
          <button
            onClick={handleDeleteClick}
            className="w-10 h-10 bg-red-50 rounded-full inline-flex justify-center items-center hover:bg-red-100 transition-colors"
            title="Delete group"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 6.66667H15M8.33333 9.16667V13.3333M11.6667 9.16667V13.3333M6.66667 6.66667L7.08333 4.58333C7.25 3.75 7.91667 3.33333 8.75 3.33333H11.25C12.0833 3.33333 12.75 3.75 12.9167 4.58333L13.3333 6.66667M6.66667 6.66667V15.8333C6.66667 16.75 7.41667 17.5 8.33333 17.5H11.6667C12.5833 17.5 13.3333 16.75 13.3333 15.8333V6.66667H6.66667Z" stroke="#DC2626" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCancelDelete}>
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[18px] font-semibold text-neutral-900 mb-2 leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Delete Group?
            </h3>
            <p className="text-[14px] text-neutral-600 mb-6 font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Are you sure you want to delete "{group.name}"? This action cannot be undone. Any habits shared with this group will be unlinked.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Info */}
      <div className="flex items-center gap-4 mb-3">
        {/* Icon */}
        <div className="w-16 h-16 bg-primary-100 rounded-2xl shadow-md flex justify-center items-center">
          <span className="text-neutral-950 text-3xl font-normal leading-9 tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
            {group.icon}
          </span>
        </div>

        {/* Group Name and Stats */}
        <div className="flex-1 flex flex-col gap-1">
          <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            {group.name}
          </h2>
          <div className="flex items-center gap-3">
            {/* Days Left */}
            <div className="flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="#718096" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 4V8L10.5 10.5" stroke="#718096" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-neutral-500 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                {group.daysLeft} days left
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Members Row */}
      {isMounted && members.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center -space-x-2">
            {members.slice(0, 4).map((member, index) => (
              <div
                key={member.id}
                className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                style={{ zIndex: members.length - index }}
                title={member.name}
              >
                {member.avatar && (member.avatar.startsWith('data:') || member.avatar.startsWith('http')) ? (
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[12px]">{member.avatar || '😊'}</span>
                )}
              </div>
            ))}
            {members.length > 4 && (
              <div className="w-8 h-8 bg-primary-200 rounded-full flex items-center justify-center border-2 border-white text-[10px] text-primary-600 font-semibold shadow-sm">
                +{members.length - 4}
              </div>
            )}
          </div>
          <span className="text-neutral-500 text-[13px] font-normal leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </div>
      )}

      {/* Description */}
      <p className="text-neutral-500 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
        {group.description}
      </p>
    </div>
  );
};

