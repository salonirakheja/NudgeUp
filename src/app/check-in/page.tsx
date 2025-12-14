'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Header } from '@/components/check-in/Header';
import { GreetingSection } from '@/components/check-in/GreetingSection';
import { ProgressCard } from '@/components/check-in/ProgressCard';
import { HabitCard } from '@/components/check-in/HabitCard';
import { FloatingButton } from '@/components/check-in/FloatingButton';
import { AddHabitModal } from '@/components/check-in/AddHabitModal';
import { BottomNav } from '@/components/layout/BottomNav';
import { useCommitments } from '@/contexts/CommitmentsContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useGroups } from '@/contexts/GroupsContext';
import { useQuery, queryOnce, tx, db } from '@/lib/instant';

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

function CheckInPageContent() {
  const router = useRouter();
  const { commitments, addCommitment } = useCommitments();
  const { user } = useAuthContext();
  const { groups } = useGroups();
  const currentUserId = user?.id || 'anonymous';
  const [isModalOpen, setIsModalOpen] = useState(false);

  const completedCount = commitments.filter(c => c.completed).length;
  const totalCommitments = commitments.length;

  // Query nudges from InstantDB
  const queryResult = useQuery(
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
          users: {
            $: {
              where: {},
            },
          },
        }
      : null
  );
  const { data: nudgesData, isLoading: nudgesLoading } = queryResult;
  const queryError = 'error' in queryResult ? queryResult.error : undefined;

  // Debug: Log query results (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && nudgesData) {
      console.log('📥 useQuery nudges result:', {
        hasData: !!nudgesData,
        nudgesCount: nudgesData?.nudges?.length || 0,
        isLoading: nudgesLoading,
        currentUserId,
      });
    }
  }, [nudgesData, nudgesLoading, currentUserId]);

  // Debug: Log query configuration (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (currentUserId && currentUserId !== 'anonymous') {
        console.log('🔍 Nudge query config:', {
          currentUserId,
          querying: true,
        });
      }
    }
  }, [currentUserId]);

  // Debug: Query ALL nudges to see what's in the database (only in development)
  useEffect(() => {
    if (currentUserId && currentUserId !== 'anonymous' && process.env.NODE_ENV === 'development') {
      const checkNudges = async () => {
        try {
          if (!queryOnce || typeof queryOnce !== 'function') {
            return;
          }
          const allNudgesData = await queryOnce({ nudges: {} }) as any;
          const allNudges = allNudgesData?.nudges || [];
          
          const nudgesForCurrentUser = allNudges.filter((n: any) => n.toUserId === currentUserId);
          const unresolvedNudges = nudgesForCurrentUser.filter((n: any) => !n.resolvedAt);
          
          // Only log if there's an actual issue
          if (unresolvedNudges.length === 0 && allNudges.length > 0) {
            console.warn('⚠️ Found nudges in DB but none match currentUserId or all are resolved', {
              currentUserId,
              allToUserIds: [...new Set(allNudges.map((n: any) => n.toUserId))],
            });
          }
        } catch (err) {
          // Silently fail in debug mode - don't spam console
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Error querying all nudges:', err);
          }
        }
      };
      
      // Only check once on mount, not periodically
      checkNudges();
    }
  }, [currentUserId]);

  // Log query errors
  useEffect(() => {
    if (queryError) {
      console.error('❌ Error querying nudges:', queryError);
    }
  }, [queryError, currentUserId]);

      // Transform InstantDB nudges to ReceivedNudge format
  const receivedNudges: ReceivedNudge[] = useMemo(() => {
    try {
      if (!nudgesData?.nudges || !Array.isArray(nudgesData.nudges)) {
        return [];
      }
      
      const filtered = nudgesData.nudges.filter((nudge: any) => {
        // Filter out invalid nudges
        if (!nudge || !nudge.id || !nudge.fromUserId || !nudge.habitId || !nudge.groupId) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Invalid nudge data:', nudge);
          }
          return false;
        }
        return true;
      });
      
      const mapped = filtered.map((nudge: any) => {
        // Look up sender info from users
        const sender = nudgesData.users?.find((u: any) => u.id === nudge.fromUserId);
        
        // Look up group info
        const group = groups.find((g) => g.id === nudge.groupId);
        
        // Look up commitment info - try to find in local commitments first
        let commitment = commitments.find((c) => c.id === nudge.habitId);
        
        // If commitment not found locally, try to get from localStorage (might be in a different user's storage)
        if (!commitment && typeof window !== 'undefined') {
          // Try to find commitment in any user's localStorage
          const allStorageKeys = Object.keys(localStorage);
          const commitmentKeys = allStorageKeys.filter(key => key.startsWith('nudgeup_commitments_'));
          
          for (const key of commitmentKeys) {
            try {
              const storedCommitments = localStorage.getItem(key);
              if (storedCommitments) {
                const parsedCommitments = JSON.parse(storedCommitments);
                const foundCommitment = parsedCommitments.find((c: any) => c.id === nudge.habitId);
                if (foundCommitment) {
                  commitment = foundCommitment;
                  break;
                }
              }
            } catch (e) {
              // Ignore errors
            }
          }
        }

        return {
          id: nudge.id,
          senderId: nudge.fromUserId,
          senderName: String(sender?.name || 'Someone'),
          senderAvatar: String(sender?.avatarImage || sender?.avatar || '😊'),
          groupId: nudge.groupId,
          groupName: group?.name || 'Group',
          commitmentId: nudge.habitId,
          commitmentName: commitment?.name || 'A commitment',
          commitmentIcon: commitment?.icon || '📝',
          type: 'individual',
          timestamp: Number(nudge.createdAt || Date.now()),
          read: false, // We filter by resolvedAt === null, so they're all unread
        } as ReceivedNudge;
      });
      
      return mapped as ReceivedNudge[];
    } catch (error) {
      console.error('❌ Error transforming nudges:', error);
      return [];
    }
  }, [nudgesData, groups, commitments]);

  // Log query parameters
  useEffect(() => {
    console.log('🔍 Nudge query params:', {
      currentUserId,
      willQuery: currentUserId && currentUserId !== 'anonymous',
    });
  }, [currentUserId]);

  // Debug logging (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const receivedNudgesCount = receivedNudges.length;
      if (receivedNudgesCount > 0) {
        console.log('✅ Received nudges that will be displayed:', receivedNudgesCount);
      }
    }
  }, [receivedNudges]);


  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Helper to check if a string looks like an ID (long alphanumeric string)
  const looksLikeId = (str: string | undefined): boolean => {
    if (!str) return true;
    // IDs are typically long alphanumeric strings (30+ chars)
    // Also check if it matches the pattern of the problematic ID
    return str.length > 30 || /^[A-Za-z0-9]{30,}$/.test(str);
  };

  // Helper to sanitize a display name - never return an ID-like string
  const sanitizeDisplayName = (name: string | undefined, fallback: string): string => {
    if (!name) return fallback;
    if (looksLikeId(name)) return fallback;
    return name;
  };

  // Helper to get display name for group or commitment, looking up from context if needed
  const getDisplayName = (nudge: ReceivedNudge, type: 'group' | 'commitment'): string => {
    if (type === 'group') {
      // Always check if groupName looks like an ID or matches groupId
      const rawName = nudge.groupName;
      if (!rawName || looksLikeId(rawName) || rawName === nudge.groupId) {
        const group = groups.find(g => g.id === nudge.groupId);
        const lookedUpName = group?.name;
        // Double-check the looked up name isn't an ID
        return sanitizeDisplayName(lookedUpName, 'Group');
      }
      // Sanitize the existing name to ensure it's not an ID
      return sanitizeDisplayName(rawName, 'Group');
    } else {
      // Always check if commitmentName looks like an ID or matches commitmentId
      const rawName = nudge.commitmentName;
      if (!rawName || looksLikeId(rawName) || rawName === nudge.commitmentId) {
        const commitment = commitments.find(c => c.id === nudge.commitmentId);
        const lookedUpName = commitment?.name;
        // Double-check the looked up name isn't an ID
        return sanitizeDisplayName(lookedUpName, 'Commitment');
      }
      // Sanitize the existing name to ensure it's not an ID
      return sanitizeDisplayName(rawName, 'Commitment');
    }
  };

  const handleNudgeClick = (nudge: ReceivedNudge) => {
    // Navigate to the check-in page and scroll to the specific task
    // If already on check-in page, just scroll to the task
    if (typeof window !== 'undefined') {
      const taskElement = document.getElementById(`habit-${nudge.commitmentId}`);
      if (taskElement) {
        // Scroll to the task with smooth behavior
        taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight the task briefly
        taskElement.style.transition = 'box-shadow 0.3s ease';
        taskElement.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.5)';
        setTimeout(() => {
          taskElement.style.boxShadow = '';
        }, 2000);
      } else {
        // If element not found yet, wait a bit and try again (in case page is still loading)
        setTimeout(() => {
          const retryElement = document.getElementById(`habit-${nudge.commitmentId}`);
          if (retryElement) {
            retryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            retryElement.style.transition = 'box-shadow 0.3s ease';
            retryElement.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.5)';
            setTimeout(() => {
              retryElement.style.boxShadow = '';
            }, 2000);
          }
        }, 100);
      }
    }
  };

  const handleDeleteNudge = async (e: React.MouseEvent, nudgeId: string) => {
    e.stopPropagation(); // Prevent triggering the nudge click handler
    
    if (!db || !tx) {
      console.error('Database not initialized');
      return;
    }

    try {
      const resolvedAt = Date.now();
      await db.transact(tx.nudges[nudgeId].update({ resolvedAt }));
      console.log('✅ Nudge deleted/resolved:', nudgeId);
    } catch (error) {
      console.error('❌ Error deleting nudge:', error);
    }
  };

  const handleAddCommitment = (newCommitment: { name: string; icon: string; duration?: number; frequencyType?: 'daily' | 'weekly'; timesPerWeek?: number; groupIds?: string[] }) => {
    addCommitment({
      name: newCommitment.name,
      icon: newCommitment.icon,
      duration: newCommitment.duration,
      frequencyType: newCommitment.frequencyType,
      timesPerWeek: newCommitment.timesPerWeek,
      groupIds: newCommitment.groupIds,
    });
    setIsModalOpen(false);
  };

  return (
    <div className="w-full max-w-[440px] min-h-[956px] relative bg-white mx-auto pb-20">
      {/* Header */}
      <div className="pt-5">
        <Header />
      </div>

      {/* Greeting Section */}
      <div className="px-6 pt-8">
        <GreetingSection userName={user?.name || (typeof window !== 'undefined' ? localStorage.getItem('userName') : null) || 'User'} />
      </div>

      {/* Progress Card */}
      <div className="px-6 pt-3">
        <ProgressCard 
          completed={completedCount} 
          total={totalCommitments}
          commitments={commitments}
        />
      </div>

      {/* Commitments Section */}
      <div className="px-6 pt-6 pb-24 flex flex-col relative">
        <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px]" style={{ fontFamily: 'Inter, sans-serif', marginBottom: '20px' }}>
          Your Daily Commitments
        </h2>
        
        {commitments.length > 0 ? (
          <div className="flex flex-col" style={{ gap: '10px' }}>
            {commitments.map((commitment) => (
              <HabitCard 
                key={commitment.id} 
                habit={commitment}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 relative">
            {/* Faded bear illustration */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <Image
                src="/icons/bear.png"
                alt="Bear illustration"
                width={300}
                height={300}
                className="object-contain"
              />
            </div>
            <p className="text-neutral-400 text-[14px] font-normal leading-[20px] text-center relative z-10" style={{ fontFamily: 'Inter, sans-serif' }}>
              No commitments yet. Tap the + button to add your first commitment!
            </p>
          </div>
        )}

        {/* Nudges Section */}
        {receivedNudges.length > 0 ? (
          <div className="flex flex-col gap-3 mt-8">
            <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Nudges ({receivedNudges.length})
            </h2>
            <div className="flex flex-col gap-2">
              {receivedNudges.map((nudge) => (
                <div
                  key={nudge.id}
                  onClick={() => handleNudgeClick(nudge)}
                  className={`px-3 py-2.5 bg-white rounded-xl border ${
                    nudge.read 
                      ? 'border-neutral-100' 
                      : 'border-success-200 bg-success-50/30'
                  } cursor-pointer hover:shadow-sm hover:border-success-300 transition-all relative`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Sender Avatar - Compact */}
                    <div className="flex-shrink-0">
                      {nudge.senderAvatar && (nudge.senderAvatar.startsWith('http') || nudge.senderAvatar.startsWith('data:')) ? (
                        <img
                          src={nudge.senderAvatar}
                          alt={nudge.senderName}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-success-100 flex items-center justify-center text-sm">
                          {nudge.senderAvatar || '😊'}
                        </div>
                      )}
                    </div>
                    
                    {/* Nudge Content - Compact Layout */}
                    <div className="flex-1 min-w-0">
                      {/* Main Message */}
                      <p className="text-neutral-700 text-[13px] font-medium leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                        <span className="font-semibold">{nudge.senderName}</span> nudged you
                      </p>
                      
                      {/* Group + Habit + Icon + Time - Single Line */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-neutral-500 text-[11px] font-normal leading-[16px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {getDisplayName(nudge, 'group')} • {getDisplayName(nudge, 'commitment')}
                        </span>
                        <span className="text-neutral-400 text-[11px]">•</span>
                        <span className="text-[13px]">{nudge.commitmentIcon}</span>
                        <span className="text-neutral-400 text-[11px] font-normal leading-[16px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {formatTimeAgo(nudge.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Dismiss Button - Compact */}
                  <button
                    onClick={(e) => handleDeleteNudge(e, nudge.id)}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-neutral-100/80 transition-colors z-10"
                    aria-label="Dismiss nudge"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                        stroke="#9CA3AF"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Floating Action Button */}
      <FloatingButton onClick={() => setIsModalOpen(true)} />

      {/* Add Commitment Modal */}
      <AddHabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddCommitment}
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

export default function CheckInPage() {
  return (
    <ProtectedRoute>
      <CheckInPageContent />
    </ProtectedRoute>
  );
}

