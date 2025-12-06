'use client';

import { useState, useEffect } from 'react';
import { useCommitments } from '@/contexts/CommitmentsContext';

interface DateHabitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD format
  dateDisplay: string; // Formatted date for display
}

export const DateHabitsModal = ({ isOpen, onClose, selectedDate, dateDisplay }: DateHabitsModalProps) => {
  const { commitments, getCompletionForDate } = useCommitments();
  const [animatedCommitments, setAnimatedCommitments] = useState<Set<string>>(new Set());

  // Reset animations when modal opens or date changes
  useEffect(() => {
    if (isOpen) {
      setAnimatedCommitments(new Set());
      // Animate checkmarks in sequence
      commitments.forEach((commitment, index) => {
        const isCompleted = getCompletionForDate(commitment.id, selectedDate);
        if (isCompleted) {
          setTimeout(() => {
            setAnimatedCommitments(prev => new Set(prev).add(commitment.id));
          }, index * 100); // Stagger by 100ms
        }
      });
    }
  }, [isOpen, selectedDate, commitments, getCompletionForDate]);

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    // Parse YYYY-MM-DD format directly to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[440px] bg-white rounded-2xl shadow-lg max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              {formatDate(selectedDate)}
            </h2>
            <p className="text-neutral-500 text-[14px] font-normal leading-[20px] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              {dateDisplay}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-neutral-50 rounded-full flex justify-center items-center hover:bg-neutral-100 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 5L5 15M5 5L15 15" stroke="#4A5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Habits List */}
        <div className="px-6 py-4">
          {commitments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-500 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                No commitments yet. Add a commitment to start tracking!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {commitments.map((commitment) => {
                const isCompleted = getCompletionForDate(commitment.id, selectedDate);
                return (
                  <div
                    key={commitment.id}
                    className="flex items-center gap-3 p-4 rounded-2xl border-2 border-neutral-100"
                  >
                    {/* Commitment Icon */}
                    <div className="w-12 h-12 bg-neutral-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">{commitment.icon}</span>
                    </div>

                    {/* Commitment Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-neutral-700 text-[16px] font-normal leading-[24px] truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {commitment.name}
                      </h3>
                      {commitment.duration && (
                        <p className="text-neutral-500 text-[13px] font-medium leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {commitment.duration} days challenge
                        </p>
                      )}
                    </div>

                    {/* Status Indicator (non-interactive) */}
                    <div
                      className={`
                        w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300
                        ${isCompleted 
                          ? 'bg-primary-500' 
                          : 'bg-neutral-200 border-2 border-neutral-300'
                        }
                      `}
                    >
                      {isCompleted && (
                        <svg 
                          width="14" 
                          height="14" 
                          viewBox="0 0 14 14" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                          style={{
                            animation: animatedCommitments.has(commitment.id) 
                              ? 'checkmarkTick 0.4s ease-out forwards' 
                              : 'none',
                            opacity: animatedCommitments.has(commitment.id) ? 1 : 0,
                            transform: animatedCommitments.has(commitment.id) ? 'scale(1)' : 'scale(0.5)',
                          }}
                        >
                          <path 
                            d="M3.5 7L6 9.5L10.5 5" 
                            stroke="white" 
                            strokeWidth="1.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

