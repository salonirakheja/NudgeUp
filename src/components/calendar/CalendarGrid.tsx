'use client';

import { useState } from 'react';
import { useCommitments } from '@/contexts/CommitmentsContext';
import { DateHabitsModal } from './DateHabitsModal';

type CompletionLevel = 'none' | '25%' | '50%' | '75%' | '100%';

interface DayData {
  date: number;
  completion: CompletionLevel;
  isToday?: boolean;
}

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const getCompletionColor = (completion: CompletionLevel) => {
  switch (completion) {
    case 'none':
      return 'bg-neutral-50';
    case '25%':
      return 'bg-success-100';
    case '50%':
      return 'bg-primary-200';
    case '75%':
      return 'bg-primary-300';
    case '100%':
      return 'bg-primary-500';
    default:
      return 'bg-neutral-50';
  }
};

const getTextColor = (completion: CompletionLevel) => {
  return completion === 'none' ? 'text-neutral-500' : 'text-neutral-700';
};

export const CalendarGrid = () => {
  const { getCompletionPercentageForDate } = useCommitments();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateDisplay, setSelectedDateDisplay] = useState<string>('');
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
  const todayDate = isCurrentMonth ? today.getDate() : null;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // Get Monday of the current week for week view
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Get week days (Monday to Sunday)
  const getWeekDays = (startDate: Date) => {
    const days: (DayData | null)[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      date.setHours(0, 0, 0, 0);
      
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const completion = getCompletionPercentageForDate(dateStr);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isToday = dateStr === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      days.push({
        date: date.getDate(),
        completion,
        isToday: isToday,
      });
    }
    return days;
  };

  const handleDateClick = (day: number, weekDate?: Date) => {
    let dateObj: Date;
    if (weekDate) {
      dateObj = new Date(weekDate);
    } else {
      dateObj = new Date(year, month, day);
    }
    
    // Create date string in YYYY-MM-DD format without timezone conversion
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    setSelectedDate(dateStr);
    setSelectedDateDisplay(formattedDate);
  };

  const handleCloseModal = () => {
    setSelectedDate(null);
    setSelectedDateDisplay('');
  };

  const days: (DayData | null)[] = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    // Create date string in YYYY-MM-DD format without timezone conversion
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const completion = getCompletionPercentageForDate(dateStr);
    days.push({
      date: day,
      completion,
      isToday: day === todayDate,
    });
  }

  const weekStart = getWeekStart(currentDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekDaysData = viewMode === 'week' ? getWeekDays(weekStart) : null;

  const formatWeekRange = () => {
    const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
    const startDay = weekStart.getDate();
    const endDay = weekEnd.getDate();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}, ${weekStart.getFullYear()}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${weekStart.getFullYear()}`;
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-5 border-2 border-neutral-50 flex flex-col gap-6">
      {/* Navigation with Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={viewMode === 'month' ? handlePrevMonth : handlePrevWeek}
          className="w-8 h-8 bg-neutral-50 rounded-full flex justify-center items-center hover:bg-neutral-100 transition-colors flex-shrink-0"
        >
          <img 
            src="/icons/Calendar/Icon-7.svg" 
            alt="Previous" 
            className="w-4 h-4"
          />
        </button>
        <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px] flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          {viewMode === 'month' 
            ? `${monthNames[month]} ${year}`
            : formatWeekRange()
          }
        </h2>
        <div className="inline-flex rounded-full p-1 gap-1 relative flex-shrink-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
          {/* Animated background slider */}
          <div
            className={`absolute top-1 bottom-1 rounded-full bg-white shadow-sm transition-all duration-300 ease-out ${
              viewMode === 'month' ? 'left-1' : 'left-[calc(50%+0.125rem)]'
            }`}
            style={{ width: 'calc(50% - 0.25rem)' }}
          />
          <button
            onClick={() => setViewMode('month')}
            className={`relative z-10 px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
              viewMode === 'month'
                ? 'text-neutral-700'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`relative z-10 px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
              viewMode === 'week'
                ? 'text-neutral-700'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Week
          </button>
        </div>
        <button
          onClick={viewMode === 'month' ? handleNextMonth : handleNextWeek}
          className="w-8 h-8 bg-neutral-50 rounded-full flex justify-center items-center hover:bg-neutral-100 transition-colors flex-shrink-0"
        >
          <img 
            src="/icons/Calendar/Icon-6.svg" 
            alt="Next" 
            className="w-4 h-4"
          />
        </button>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center">
            <span className="text-neutral-700 text-base font-semibold leading-6" style={{ fontFamily: 'Inter, sans-serif' }}>
              {day}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      {viewMode === 'month' ? (
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="h-11" />;
            }

            const bgColor = getCompletionColor(day.completion);
            const textColor = getTextColor(day.completion);
            const isToday = day.isToday;

            // Determine indicator color
            const getIndicatorColor = () => {
              if (day.completion === '100%') return 'bg-primary-500';
              if (day.completion === 'none') return '';
              return 'bg-yellow-400'; // For partial (25%, 50%, 75%)
            };

            const dayOfWeek = new Date(year, month, day.date).getDay();
            return (
              <button
                key={day.date}
                onClick={() => handleDateClick(day.date)}
                className={`
                  w-full aspect-square rounded-xl flex flex-col justify-center items-center relative
                  ${bgColor}
                  ${day.completion === 'none' ? 'border-2 border-neutral-200' : ''}
                  ${isToday ? 'ring-4 ring-[#FFE5E5] ring-offset-0' : ''}
                  hover:opacity-80 transition-opacity cursor-pointer
                `}
                style={{ borderRadius: '12px' }}
              >
                <span className={`${textColor} text-base font-normal leading-6`} style={{ fontFamily: 'Inter, sans-serif' }}>
                  {day.date}
                </span>
                {/* Mini indicator */}
                {getIndicatorColor() && (
                  <div className={`absolute bottom-1.5 w-1 h-1 rounded-full ${getIndicatorColor()}`}></div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {weekDaysData?.map((day, index) => {
            if (!day) return null;

            const bgColor = getCompletionColor(day.completion);
            const textColor = getTextColor(day.completion);
            const isToday = day.isToday;
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + index);

            // Determine indicator color
            const getIndicatorColor = () => {
              if (day.completion === '100%') return 'bg-primary-500';
              if (day.completion === 'none') return '';
              return 'bg-yellow-400'; // For partial (25%, 50%, 75%)
            };

            const dayOfWeek = date.getDay();
            return (
              <button
                key={index}
                onClick={() => handleDateClick(date.getDate(), date)}
                className={`
                  w-full aspect-square rounded-xl flex flex-col justify-center items-center relative
                  ${bgColor}
                  ${day.completion === 'none' ? 'border-2 border-neutral-200' : ''}
                  ${isToday ? 'ring-4 ring-[#FFE5E5] ring-offset-0' : ''}
                  hover:opacity-80 transition-opacity cursor-pointer
                `}
                style={{ borderRadius: '12px' }}
              >
                <span className={`${textColor} text-base font-normal leading-6`} style={{ fontFamily: 'Inter, sans-serif' }}>
                  {day.date}
                </span>
                {/* Mini indicator */}
                {getIndicatorColor() && (
                  <div className={`absolute bottom-1.5 w-1 h-1 rounded-full ${getIndicatorColor()}`}></div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Date Habits Modal */}
      {selectedDate && (
        <DateHabitsModal
          isOpen={!!selectedDate}
          onClose={handleCloseModal}
          selectedDate={selectedDate}
          dateDisplay={selectedDateDisplay}
        />
      )}
    </div>
  );
};

