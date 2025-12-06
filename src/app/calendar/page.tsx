'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { StreakStatsCards } from '@/components/calendar/StreakStatsCards';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { CompletionLegend } from '@/components/calendar/CompletionLegend';
import { BottomNav } from '@/components/layout/BottomNav';

function CalendarPageContent() {
  return (
    <div className="w-full max-w-[440px] min-h-[956px] relative bg-white mx-auto pb-20">
      {/* Header */}
      <div className="px-6 pt-0">
        <CalendarHeader />
      </div>

      {/* Streak Stats */}
      <div className="px-6 pt-6">
        <StreakStatsCards />
      </div>

      {/* Calendar Grid */}
      <div className="px-6 pt-3">
        <CalendarGrid />
      </div>

      {/* Completion Legend */}
      <div className="px-6 pt-6">
        <CompletionLegend />
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

export default function CalendarPage() {
  return (
    <ProtectedRoute>
      <CalendarPageContent />
    </ProtectedRoute>
  );
}

