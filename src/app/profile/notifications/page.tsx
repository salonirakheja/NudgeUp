'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQuery } from '@/lib/instant';
import { useCommitments } from '@/contexts/CommitmentsContext';
import { useGroups } from '@/contexts/GroupsContext';

const STORAGE_KEY_NOTIFICATIONS = 'nudgeup_notificationSettings';

interface ReceivedNudge {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  groupId: string;
  groupName: string;
  commitmentId: string;
  commitmentName: string;
  commitmentIcon: string;
  type: string;
  timestamp: number;
  read: boolean;
}

interface NotificationSettings {
  habitReminders: boolean;
  groupUpdates: boolean;
  achievementAlerts: boolean;
  weeklyReports: boolean;
}

const defaultSettings: NotificationSettings = {
  habitReminders: true,
  groupUpdates: true,
  achievementAlerts: true,
  weeklyReports: false,
};

const loadSettings = (): NotificationSettings => {
  if (typeof window === 'undefined') return defaultSettings;
  const stored = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
  return stored ? JSON.parse(stored) : defaultSettings;
};

const saveSettings = (settings: NotificationSettings) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(settings));
  }
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { commitments } = useCommitments();
  const { groups } = useGroups();
  const currentUserId = user?.id || 'anonymous';
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  // Query nudges from InstantDB
  const { data: nudgesData, isLoading: nudgesLoading, error: queryError } = useQuery(
    currentUserId && currentUserId !== 'anonymous'
      ? {
          nudges: {
            $: {
              where: {
                toUserId: currentUserId,
                resolvedAt: { $isNull: true },
              },
              order: {
                createdAt: 'desc',
              },
            },
          },
          users: {},
        }
      : null
  );

  // Log query errors
  useEffect(() => {
    if (queryError) {
      console.error('❌ Error querying nudges in notifications page:', queryError);
    }
  }, [queryError]);

  // Transform InstantDB nudges to ReceivedNudge format
  const receivedNudges: ReceivedNudge[] = (() => {
    try {
      if (!nudgesData?.nudges || !Array.isArray(nudgesData.nudges)) {
        return [];
      }
      
      return nudgesData.nudges
        .filter((nudge: any) => {
          // Filter out invalid nudges
          if (!nudge || !nudge.id || !nudge.fromUserId || !nudge.habitId || !nudge.groupId) {
            console.warn('⚠️ Invalid nudge data in notifications:', nudge);
            return false;
          }
          return true;
        })
        .map((nudge: any) => {
          // Look up sender info from users
          const sender = nudgesData.users?.find((u: any) => u.id === nudge.fromUserId);
          // Look up group info
          const group = groups.find((g) => g.id === nudge.groupId);
          // Look up commitment info
          const commitment = commitments.find((c) => c.id === nudge.habitId);

          return {
            id: nudge.id,
            senderId: nudge.fromUserId,
            senderName: sender?.name || 'Someone',
            senderAvatar: sender?.avatarImage || sender?.avatar || '😊',
            groupId: nudge.groupId,
            groupName: group?.name || 'Group',
            commitmentId: nudge.habitId,
            commitmentName: commitment?.name || 'Commitment',
            commitmentIcon: commitment?.icon || '📝',
            type: 'individual',
            timestamp: nudge.createdAt || Date.now(),
            read: false, // We filter by resolvedAt === null, so they're all unread
          };
        });
    } catch (error) {
      console.error('❌ Error transforming nudges in notifications:', error);
      return [];
    }
  })();


  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      saveSettings(settings);
    await new Promise(resolve => setTimeout(resolve, 500));
      alert('Notification settings saved!');
      router.back();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
    setIsLoading(false);
    }
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
      {/* Received Nudges Section */}
      {receivedNudges.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-neutral-700 text-lg font-semibold leading-6" style={{ fontFamily: 'Inter, sans-serif' }}>
            Nudges
          </h2>
          <div className="flex flex-col gap-3">
            {receivedNudges.map((nudge) => (
                <div
                  key={nudge.id}
                  onClick={() => {
                    router.push(`/groups/${nudge.groupId}`);
                  }}
                  className={`p-4 bg-white rounded-2xl shadow-md border-2 ${
                    nudge.read ? 'border-neutral-50' : 'border-primary-200'
                  } cursor-pointer hover:shadow-lg transition-shadow`}
                >
                  <div className="flex items-start gap-3">
                    {/* Sender Avatar */}
                    <div className="w-10 h-10 bg-neutral-50 rounded-full flex justify-center items-center flex-shrink-0 overflow-hidden">
                      {nudge.senderAvatar && (nudge.senderAvatar.startsWith('data:') || nudge.senderAvatar.startsWith('http')) ? (
                        <img src={nudge.senderAvatar} alt={nudge.senderName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">{nudge.senderAvatar || '😊'}</span>
                      )}
                    </div>
                    
                    {/* Nudge Content */}
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-neutral-700 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <span className="font-medium">{nudge.senderName}</span>
                            {' '}nudged you to complete{' '}
                            <span className="font-medium">{nudge.commitmentName}</span>
                            {' '}in{' '}
                            <span className="font-medium">{nudge.groupName}</span>
                          </p>
                        </div>
                        <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1"></div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-6 h-6 bg-neutral-50 rounded-lg flex justify-center items-center">
                          <span className="text-sm">{nudge.commitmentIcon}</span>
                        </div>
                        <span className="text-neutral-500 text-[12px] font-normal leading-[16px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {formatTimeAgo(nudge.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notification Settings */}
        <div className="flex flex-col gap-4">
          <h2 className="text-neutral-700 text-lg font-semibold leading-6" style={{ fontFamily: 'Inter, sans-serif' }}>
            Settings
          </h2>
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

