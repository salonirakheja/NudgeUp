'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Commitment } from '@/types';
import { useCommitments } from '@/contexts/CommitmentsContext';
import { useGroups } from '@/contexts/GroupsContext';
import { ManageGroupsModal } from './ManageGroupsModal';

interface HabitCardProps {
  habit: Commitment;
}

function HabitCard({ habit }: HabitCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showManageGroupsModal, setShowManageGroupsModal] = useState(false);
  const { toggleCommitmentCompletion, updateCommitment, getCompletionForDate, completions } = useCommitments();
  const { groups } = useGroups();
  
  // Get assigned groups
  const assignedGroups = habit.groupIds 
    ? groups.filter(g => habit.groupIds?.includes(g.id))
    : [];
  
  const groupNames = assignedGroups.map(g => g.name).join(', ');

  // Get last 7 days for weekly tracker in Sun-Sat order
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get the day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = today.getDay();
    
    // Calculate Sunday of current week
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);
    
    // Generate Sun-Sat week
    for (let i = 0; i < 7; i++) {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const last7Days = getLast7Days();

  // Check if a day was completed using actual completion data
  const isDayCompleted = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    if (checkDate > today) return null; // Upcoming
    if (checkDate.getTime() === today.getTime()) return habit.completed; // Today
    // For past days, check completion history
    const dateStr = checkDate.toISOString().split('T')[0];
    return getCompletionForDate(habit.id, dateStr);
  };

  // Calculate completed days this week
  const completedThisWeek = last7Days.filter(day => {
    const completed = isDayCompleted(day);
    return completed === true;
  }).length;

  const handleToggle = () => {
    toggleCommitmentCompletion(habit.id);
  };

  const handleUpdateGroups = (groupIds: string[]) => {
    updateCommitment(habit.id, { groupIds });
  };

  return (
    <div className={`w-full bg-white rounded-2xl border transition-all ${
      isExpanded 
        ? 'border-[#E5E5EA] shadow-md' 
        : 'border-[#E5E5EA] shadow-sm'
    }`}>
      {/* Card Header - Apple Fitness style, reduced padding by ~12% */}
      <div className="px-6 py-2.5 flex items-center gap-3">
        {/* Emoji - Left side */}
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-xl" style={{ lineHeight: '1' }}>{habit.icon}</span>
        </div>

        {/* Title and Streak - Stacked layout */}
        <div className="flex-1 min-w-0">
          {/* Title - Semibold */}
          <h3 
            className="text-neutral-700 text-[17px] font-semibold leading-[130%] truncate"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}
          >
            {habit.name}
          </h3>
          {/* Streak text - Neutral grey for 0 days, green only for >0 days, with green streak icon */}
          <div className="flex items-center gap-1.5" style={{ marginTop: '3px' }}>
            <img 
              src="/icons/Calendar/Icon-4.svg" 
              alt="Streak" 
              className="w-3.5 h-3.5 flex-shrink-0"
            />
            <span 
              className={`text-[13px] font-normal leading-[18px] ${
                habit.streak > 0 ? 'text-primary-600' : 'text-neutral-400'
              }`}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {habit.streak}-day streak
            </span>
          </div>
        </div>

        {/* Right side: Checkmark button and chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Green checkmark button - Apple Fitness style */}
          <button
            onClick={handleToggle}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              habit.completed 
                ? 'bg-[#BDC225]' 
                : 'bg-white border border-neutral-300'
            }`}
            style={{
              boxShadow: habit.completed ? 'inset 0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            {habit.completed ? (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 8L6 11L13 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <div className="w-2 h-2 rounded-full bg-neutral-300"></div>
            )}
          </button>
          
          {/* Chevron icon - Down when collapsed, Up when expanded */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 flex items-center justify-center"
            style={{ color: '#A0A8B0' }}
          >
            {isExpanded ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content - Apple Fitness style, reduced padding by ~12% */}
      {isExpanded && (
        <>
          {/* Subtle divider */}
          <div className="mx-6 h-px bg-neutral-100"></div>
          <div className="px-6 pb-2.5 pt-2">
            {/* THIS WEEK Section - Moved directly under divider */}
            <div className="mb-4">
              <div 
                className="text-neutral-400 text-[11px] font-medium uppercase tracking-wide mb-2"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                This Week
              </div>
              <div className="grid grid-cols-7 gap-0 items-start">
                {last7Days.map((day, index) => {
                  const completed = isDayCompleted(day);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const checkDate = new Date(day);
                  checkDate.setHours(0, 0, 0, 0);
                  const isToday = checkDate.getTime() === today.getTime();
                  const isFuture = checkDate > today;
                  const isPast = checkDate < today;
                  
                  // Get weekday label: Sun, Mon, Tue, Wed, Thu, Fri, Sat
                  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  const dayOfWeek = day.getDay();
                  const dayLabel = weekdayLabels[dayOfWeek];
                  
                  // Determine circle style based on state
                  let circleStyle: CSSProperties = {};
                  let circleClass = '';
                  
                  if (completed === true) {
                    // Completed: solid green fill (#BDC225) with white check and slight inner shadow
                    circleClass = 'bg-[#BDC225]';
                    circleStyle = {
                      boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)'
                    };
                  } else if (completed === false && isPast) {
                    // Past incomplete: red boundary only (#FF7A7A), 1.5px stroke, no fill
                    circleClass = 'bg-white';
                    circleStyle = { 
                      borderColor: '#FF7A7A',
                      borderWidth: '1.5px',
                      borderStyle: 'solid',
                      backgroundColor: 'transparent'
                    };
                  } else if (isToday && !completed) {
                    // Today incomplete: grey outline (#D1D1D6) with optional slight highlight
                    circleClass = 'bg-white';
                    circleStyle = { 
                      borderColor: '#D1D1D6',
                      borderWidth: '1.5px',
                      borderStyle: 'solid',
                      backgroundColor: 'rgba(209, 209, 214, 0.1)'
                    };
                  } else if (isFuture) {
                    // Future: darker grey outline
                    circleClass = 'bg-white';
                    circleStyle = { 
                      borderColor: '#D1D1D6',
                      borderWidth: '1.5px',
                      borderStyle: 'solid',
                      opacity: 0.6
                    };
                  } else {
                    // Default: grey outline
                    circleClass = 'bg-white';
                    circleStyle = { 
                      borderColor: '#D1D1D6',
                      borderWidth: '1.5px',
                      borderStyle: 'solid'
                    };
                  }
                  
                  return (
                    <div key={index} className="flex flex-col items-center" style={{ gap: '5px' }}>
                      {/* Day label - Centered 4-6px above circle */}
                      <span 
                        className="text-neutral-500 text-[10px] font-normal leading-[14px]"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {dayLabel}
                      </span>
                      {/* Apple Fitness style circular indicator - slightly smaller, clickable if today */}
                      {isToday ? (
                        <button
                          onClick={handleToggle}
                          className={`rounded-full flex items-center justify-center transition-all active:scale-95 ${circleClass}`}
                          style={{
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            ...circleStyle
                          }}
                        >
                          {completed === true && (
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 8L6 11L13 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      ) : (
                        <div
                          className={`rounded-full flex items-center justify-center ${circleClass}`}
                          style={{
                            width: '32px',
                            height: '32px',
                            ...circleStyle
                          }}
                        >
                          {completed === true && (
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 8L6 11L13 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STATS Section - Single compact line */}
            <div className="mb-4" style={{ marginTop: '16px' }}>
              <div 
                className="text-neutral-400 text-[11px] font-medium uppercase tracking-wide mb-1"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Stats
              </div>
              <div className="text-neutral-500 text-[12px] font-normal leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                Streak: <span className={habit.streak > 0 ? 'text-primary-600' : 'text-neutral-500'}>{habit.streak}</span> · Best: <span className={habit.streak > 0 ? 'text-primary-600' : 'text-neutral-500'}>{habit.streak}</span> · This week: {completedThisWeek}/7
              </div>
            </div>

            {/* GROUPS Section - Simplified */}
            <div>
              <div 
                className="text-neutral-400 text-[11px] font-medium uppercase tracking-wide mb-1"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Groups
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {assignedGroups.length > 0 ? (
                  <>
                    <span className="text-neutral-700 text-[12px] font-normal leading-[18px] flex-1 min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {groupNames}
                    </span>
                    <button
                      onClick={() => setShowManageGroupsModal(true)}
                      className="text-primary-600 text-[12px] font-medium hover:underline flex-shrink-0"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      Manage
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-neutral-500 text-[12px] font-normal leading-[18px] flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Not in any groups yet
                    </span>
                    <button
                      onClick={() => setShowManageGroupsModal(true)}
                      className="text-primary-600 text-[12px] font-medium hover:underline flex-shrink-0"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      Manage
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Manage Groups Modal */}
      <ManageGroupsModal
        isOpen={showManageGroupsModal}
        onClose={() => setShowManageGroupsModal(false)}
        commitment={habit}
        groups={groups}
        onUpdate={handleUpdateGroups}
      />
    </div>
  );
}

export { HabitCard };



















