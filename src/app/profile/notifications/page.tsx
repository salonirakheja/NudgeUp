'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function NotificationsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    habitReminders: true,
    groupUpdates: true,
    achievementAlerts: true,
    weeklyReports: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    // TODO: Implement actual save logic
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
    router.back();
  };

  return (
    <div className="w-full max-w-[440px] min-h-[956px] relative bg-white mx-auto pb-20">
      {/* Header */}
      <div className="px-6 pt-12 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-neutral-50 rounded-full flex justify-center items-center"
        >
          <img 
            src="/icons/Profile/Icon-10.svg" 
            alt="Back" 
            className="w-5 h-5"
          />
        </button>
        <h1 className="text-neutral-700 text-xl font-medium leading-8" style={{ fontFamily: 'Inter, sans-serif' }}>
          Notifications
        </h1>
      </div>

      {/* Content */}
      <div className="px-6 pt-8 flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          {/* Habit Reminders */}
          <div className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-md border-2 border-neutral-50">
            <div className="flex flex-col gap-1">
              <span className="text-neutral-700 text-base font-normal leading-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                Habit Reminders
              </span>
              <span className="text-neutral-500 text-sm font-normal leading-5" style={{ fontFamily: 'Inter, sans-serif' }}>
                Daily reminders for your habits
              </span>
            </div>
            <button
              onClick={() => handleToggle('habitReminders')}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.habitReminders ? 'bg-primary-400' : 'bg-neutral-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.habitReminders ? 'translate-x-6' : 'translate-x-0.5'
                }`}
                style={{ marginTop: '2px' }}
              />
            </button>
          </div>

          {/* Group Updates */}
          <div className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-md border-2 border-neutral-50">
            <div className="flex flex-col gap-1">
              <span className="text-neutral-700 text-base font-normal leading-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                Group Updates
              </span>
              <span className="text-neutral-500 text-sm font-normal leading-5" style={{ fontFamily: 'Inter, sans-serif' }}>
                Notifications from your groups
              </span>
            </div>
            <button
              onClick={() => handleToggle('groupUpdates')}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.groupUpdates ? 'bg-primary-400' : 'bg-neutral-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.groupUpdates ? 'translate-x-6' : 'translate-x-0.5'
                }`}
                style={{ marginTop: '2px' }}
              />
            </button>
          </div>

          {/* Achievement Alerts */}
          <div className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-md border-2 border-neutral-50">
            <div className="flex flex-col gap-1">
              <span className="text-neutral-700 text-base font-normal leading-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                Achievement Alerts
              </span>
              <span className="text-neutral-500 text-sm font-normal leading-5" style={{ fontFamily: 'Inter, sans-serif' }}>
                Celebrate your milestones
              </span>
            </div>
            <button
              onClick={() => handleToggle('achievementAlerts')}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.achievementAlerts ? 'bg-primary-400' : 'bg-neutral-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.achievementAlerts ? 'translate-x-6' : 'translate-x-0.5'
                }`}
                style={{ marginTop: '2px' }}
              />
            </button>
          </div>

          {/* Weekly Reports */}
          <div className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-md border-2 border-neutral-50">
            <div className="flex flex-col gap-1">
              <span className="text-neutral-700 text-base font-normal leading-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                Weekly Reports
              </span>
              <span className="text-neutral-500 text-sm font-normal leading-5" style={{ fontFamily: 'Inter, sans-serif' }}>
                Summary of your weekly progress
              </span>
            </div>
            <button
              onClick={() => handleToggle('weeklyReports')}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.weeklyReports ? 'bg-primary-400' : 'bg-neutral-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.weeklyReports ? 'translate-x-6' : 'translate-x-0.5'
                }`}
                style={{ marginTop: '2px' }}
              />
            </button>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <Button
              onClick={handleSave}
              variant="primary"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

