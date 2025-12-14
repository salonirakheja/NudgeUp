'use client';

import { useState, useEffect } from 'react';
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toggleCommitmentCompletion, updateCommitment, getCompletionForDate, completions, getWeeklyCompletionCount, getWeeklyStreak, getCommitmentStreak, deleteCommitment } = useCommitments();
  const { groups } = useGroups();
  
  // Swipe-to-delete state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const DELETE_BUTTON_WIDTH = 80;
  const SWIPE_THRESHOLD = 50;
  const MIN_SWIPE_DISTANCE = 50; // Minimum distance to trigger swipe reset
  
  // Determine if this is a weekly habit
  const isWeekly = habit.frequencyType === 'weekly';
  const timesPerWeek = habit.timesPerWeek || 3;
  const weeklyCount = isWeekly ? getWeeklyCompletionCount(habit.id) : 0;
  const weeklyStreak = isWeekly ? (habit.weeklyStreak || getWeeklyStreak(habit.id)) : 0;
  
  // Calculate daily streak dynamically from completions to ensure consistency
  // Calculate directly here to ensure we always use the latest completions array
  const calculatedDailyStreak = !isWeekly ? (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let currentDate = new Date(today);

    // Check backwards from today
    while (true) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const completion = completions.find(
        (c) => c.commitmentId === habit.id && c.date === dateStr && c.completed
      );

      if (completion?.completed) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
        currentDate.setHours(0, 0, 0, 0);
      } else {
        break;
      }
    }

    return streak;
  })() : 0;
  
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

  // Swipe-to-delete handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    // Don't allow swipe when card is expanded
    if (isExpanded) return;
    
    // Check if touch started on an interactive element
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null || isExpanded) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = touchStart.x - currentX;
    const diffY = Math.abs(touchStart.y - currentY);
    
    // Only allow horizontal swipe (not vertical scrolling)
    if (diffY > Math.abs(diffX)) {
      // Vertical movement - cancel swipe
      setTouchStart(null);
      setSwipeOffset(0);
      return;
    }
    
    // Only allow swiping left (positive diffX)
    if (diffX > 0) {
      // Limit swipe to delete button width
      const newOffset = Math.min(diffX, DELETE_BUTTON_WIDTH);
      setSwipeOffset(newOffset);
    } else if (diffX < -MIN_SWIPE_DISTANCE) {
      // Swiping right significantly - reset
      setSwipeOffset(0);
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    if (touchStart === null || isExpanded) return;
    
    // If swiped past threshold, reveal delete button
    if (swipeOffset >= SWIPE_THRESHOLD) {
      setSwipeOffset(DELETE_BUTTON_WIDTH);
    } else {
      // Otherwise, snap back
      setSwipeOffset(0);
    }
    
    setTouchStart(null);
  };

  // Mouse handlers for desktop support
  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't allow swipe when card is expanded
    if (isExpanded) return;
    
    // Check if click started on an interactive element
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    
    // If delete button is already revealed, check if click is in that area
    if (swipeOffset > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const cardWidth = rect.width;
      // If click is in the right area where delete button is, don't start drag
      if (clickX > cardWidth - DELETE_BUTTON_WIDTH) {
        return;
      }
    }
    
    // Only start drag on left mouse button
    if (e.button !== 0) return;
    
    setTouchStart({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    deleteCommitment(habit.id);
    setSwipeOffset(0);
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setSwipeOffset(0); // Also reset swipe when canceling
  };

  const handleCancelSwipe = () => {
    setSwipeOffset(0);
  };

  // Global mouse tracking for desktop drag
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (touchStart === null || isExpanded) return;
      
      const currentX = e.clientX;
      const currentY = e.clientY;
      const diffX = touchStart.x - currentX;
      const diffY = Math.abs(touchStart.y - currentY);
      
      // Only allow horizontal drag (not vertical scrolling)
      if (diffY > Math.abs(diffX)) {
        // Vertical movement - cancel swipe
        setTouchStart(null);
        setSwipeOffset(0);
        return;
      }
      
      // Only allow dragging left (positive diffX)
      if (diffX > 0) {
        // Limit drag to delete button width
        const newOffset = Math.min(diffX, DELETE_BUTTON_WIDTH);
        setSwipeOffset(newOffset);
      } else if (diffX < -MIN_SWIPE_DISTANCE) {
        // Dragging right significantly - reset
        setSwipeOffset(0);
        setTouchStart(null);
      }
    };

    const handleGlobalMouseUp = () => {
      if (touchStart === null || isExpanded) return;
      
      // If dragged past threshold, reveal delete button
      if (swipeOffset >= SWIPE_THRESHOLD) {
        setSwipeOffset(DELETE_BUTTON_WIDTH);
      } else {
        // Otherwise, snap back
        setSwipeOffset(0);
      }
      
      setTouchStart(null);
    };

    if (touchStart !== null) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [touchStart, swipeOffset, isExpanded]);

  return (
    <div className="relative w-full" style={{ overflow: 'hidden' }}>
      {/* Delete Button - Behind the card */}
      <div 
        className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-red-500 rounded-2xl"
        style={{ 
          width: `${DELETE_BUTTON_WIDTH}px`,
          zIndex: swipeOffset > 0 ? 50 : 1, // Much higher z-index than overlay (z-10) when revealed
          height: '100%',
          pointerEvents: swipeOffset > 0 ? 'auto' : 'none',
        }}
        onClick={(e) => {
          // Stop propagation to prevent overlay from handling
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          // Stop propagation to prevent overlay from handling
          e.stopPropagation();
        }}
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.nativeEvent) {
              e.nativeEvent.stopImmediatePropagation();
            }
            handleDelete();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.nativeEvent) {
              e.nativeEvent.stopImmediatePropagation();
            }
          }}
          className="w-full h-full flex items-center justify-center active:bg-red-600 transition-colors hover:bg-red-600"
          aria-label="Delete commitment"
          type="button"
          style={{ position: 'relative', pointerEvents: 'auto', zIndex: 51 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 11V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 11V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Card Container - Swipeable */}
      <div
        id={`habit-${habit.id}`}
        className={`w-full bg-white rounded-2xl border transition-all relative`}
        style={{
          transform: `translateX(-${swipeOffset}px)`,
          transition: touchStart === null ? 'transform 0.3s ease-out' : 'none',
          zIndex: 2,
          borderColor: isExpanded ? '#E5E5EA' : '#E5E5EA',
          boxShadow: isExpanded ? '0 2px 8px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
          touchAction: 'pan-y', // Allow vertical scrolling but handle horizontal swipe
          userSelect: 'none', // Prevent text selection while dragging
          cursor: touchStart !== null ? 'grabbing' : 'grab',
          pointerEvents: 'auto',
          backgroundColor: 'white', // Ensure card has background to cover delete button
          width: swipeOffset > 0 ? `calc(100% - ${DELETE_BUTTON_WIDTH}px)` : '100%', // Shrink card width when delete is revealed
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
      {/* Card Header - Apple Fitness style, reduced padding by ~12% */}
      <div className="px-6 py-2.5 flex items-start gap-3">
        {/* Emoji - Left side */}
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0" style={{ marginTop: '2px' }}>
          <span className="text-xl" style={{ lineHeight: '1' }}>{habit.icon}</span>
        </div>

        {/* Title and Streak - Stacked layout */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Title - Semibold */}
          <div className="flex items-center gap-2 justify-start">
          <h3 
              className="text-neutral-700 text-[17px] font-semibold leading-[130%] truncate text-left"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}
          >
            {habit.name}
          </h3>
            {/* Weekly frequency tag */}
            {isWeekly && (
              <span 
                className="text-[11px] font-medium leading-[16px] px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full flex-shrink-0"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {timesPerWeek}×/week
              </span>
            )}
          </div>
          {/* Streak text - Different for daily vs weekly */}
          {isWeekly ? (
            <div className="flex flex-col gap-0.5 items-start" style={{ marginTop: '3px' }}>
              <span 
                className="text-[13px] font-normal leading-[18px] text-neutral-700 text-left"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                This week: {weeklyCount} / {timesPerWeek}
              </span>
              <div className="flex items-center gap-1.5 justify-start">
                <img 
                  src="/icons/Calendar/Icon-4.svg" 
                  alt="Streak" 
                  className="w-3.5 h-3.5 flex-shrink-0"
                />
                <span 
                  className="text-[13px] font-normal leading-[18px] text-neutral-500 text-left"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Weekly streak: {weeklyStreak} weeks
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 justify-start" style={{ marginTop: '3px' }}>
            <img 
              src="/icons/Calendar/Icon-4.svg" 
              alt="Streak" 
              className="w-3.5 h-3.5 flex-shrink-0"
            />
            <span 
                className="text-[13px] font-normal leading-[18px] text-neutral-500 text-left"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
                Daily streak: {calculatedDailyStreak}
            </span>
          </div>
          )}
        </div>

        {/* Right side: Checkmark button and chevron */}
        <div className="flex items-center gap-2 flex-shrink-0" style={{ marginTop: '2px' }}>
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
            {isWeekly ? (
              <>
                {/* WEEKLY GOAL Section */}
                <div className="mb-4">
                  <div 
                    className="text-neutral-400 text-[11px] font-medium uppercase tracking-wide mb-2"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Weekly Goal
                  </div>
                  <div className="text-neutral-700 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Do this {timesPerWeek} times per week
                  </div>
                </div>

                {/* WEEKLY PROGRESS Section */}
                <div className="mb-4">
                  <div 
                    className="text-neutral-400 text-[11px] font-medium uppercase tracking-wide mb-2"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Weekly Progress
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full overflow-hidden" style={{ height: '12px' }}>
                    <div 
                      className="bg-[#BDC225] rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((weeklyCount / timesPerWeek) * 100, 100)}%`, height: '12px' }}
                    />
                  </div>
                  <div className="text-neutral-500 text-[12px] font-normal leading-[18px] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {weeklyCount} / {timesPerWeek} completed
                  </div>
                </div>

                {/* THIS WEEK Section - Day dots */}
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
              </>
            ) : (
              <>
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
                    Streak: <span className={calculatedDailyStreak > 0 ? 'text-primary-600' : 'text-neutral-500'}>{calculatedDailyStreak}</span> · Best: <span className={calculatedDailyStreak > 0 ? 'text-primary-600' : 'text-neutral-500'}>{calculatedDailyStreak}</span> · This week: {completedThisWeek}/7
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
              </>
            )}
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
      
      {/* Overlay to cancel swipe when clicking outside */}
      {swipeOffset > 0 && !showDeleteConfirm && (
        <div
          className="fixed inset-0 z-10"
          onClick={(e) => {
            // Don't cancel if clicking on the delete button or its container
            const target = e.target as HTMLElement;
            if (target.closest('[aria-label="Delete commitment"]') || 
                target.closest('.bg-red-500')) {
              e.stopPropagation();
              return;
            }
            handleCancelSwipe();
          }}
          onMouseDown={(e) => {
            // Don't block delete button clicks
            const target = e.target as HTMLElement;
            if (target.closest('[aria-label="Delete commitment"]') || 
                target.closest('.bg-red-500')) {
              e.stopPropagation();
              return;
            }
          }}
          style={{ backgroundColor: 'transparent', pointerEvents: 'auto' }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" 
          onClick={handleCancelDelete}
        >
          <div 
            className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full" 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 
              className="text-[18px] font-semibold text-neutral-900 mb-2 leading-[24px]" 
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Delete Commitment?
            </h3>
            <p 
              className="text-[14px] text-neutral-600 mb-6 font-normal leading-[20px]" 
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Are you sure you want to delete "{habit.name}"? This action cannot be undone. All progress and completions will be lost.
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
    </div>
  );
}

export { HabitCard };



















