'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Commitment, CommitmentCompletion } from '@/types';
import { useAuthContext } from '@/contexts/AuthContext';
import { tx, queryOnce, db } from '@/lib/instant';

interface CommitmentsContextType {
  commitments: Commitment[];
  completions: CommitmentCompletion[];
  addCommitment: (commitment: Omit<Commitment, 'id' | 'createdAt' | 'streak' | 'completed'>) => void;
  updateCommitment: (id: string, updates: Partial<Commitment>) => void;
  deleteCommitment: (id: string) => void;
  toggleCommitmentCompletion: (commitmentId: string, date?: string) => void;
  getCompletionForDate: (commitmentId: string, date: string) => boolean;
  getCompletionPercentageForDate: (date: string) => 'none' | '25%' | '50%' | '75%' | '100%';
  getCommitmentStreak: (commitmentId: string) => number;
  getWeeklyCompletionCount: (commitmentId: string) => number;
  getWeeklyStreak: (commitmentId: string) => number;
}

const CommitmentsContext = createContext<CommitmentsContextType | undefined>(undefined);

export function CommitmentsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const userId = user?.id || 'anonymous';
  
  // Use user-specific storage keys
  const STORAGE_KEY_COMMITMENTS = `nudgeup_commitments_${userId}`;
  const STORAGE_KEY_COMPLETIONS = `nudgeup_completions_${userId}`;
  
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [completions, setCompletions] = useState<CommitmentCompletion[]>([]);

  // Function to load commitments from localStorage
  const loadCommitments = useCallback(() => {
    // Only load if we have a real user ID (not anonymous)
    if (!user?.id || userId === 'anonymous') {
      return;
    }
    
    const storedCommitments = localStorage.getItem(STORAGE_KEY_COMMITMENTS);
    const storedCompletions = localStorage.getItem(STORAGE_KEY_COMPLETIONS);

    let loadedCommitments: Commitment[] = [];
    let loadedCompletions: CommitmentCompletion[] = [];

    if (storedCommitments) {
      try {
        loadedCommitments = JSON.parse(storedCommitments);
      } catch (e) {
        console.error('Error loading commitments from localStorage:', e);
      }
    }
    // New users start with empty commitments - they can create their own

    if (storedCompletions) {
      try {
        const parsed = JSON.parse(storedCompletions);
        // Ensure all completions have the completed property (migration for old data)
        loadedCompletions = Array.isArray(parsed) 
          ? parsed.map((c: any) => ({
              ...c,
              completed: c.completed !== undefined ? c.completed : true, // Default to true for old completions
            }))
          : [];
      } catch (e) {
        console.error('Error loading completions from localStorage:', e);
      }
    }

    // Set completions first
    setCompletions(loadedCompletions);

    // Update commitments with current completion status and recalculate streaks
    const todayObj = new Date();
    const todayYear = todayObj.getFullYear();
    const todayMonth = todayObj.getMonth() + 1;
    const todayDay = todayObj.getDate();
    const today = `${todayYear}-${String(todayMonth).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
    
    const updatedCommitments = loadedCommitments.map((commitment) => {
      // Explicitly check for today's completion - only true if there's a completion record for today with completed: true
      const todayCompletion = loadedCompletions.find(
        (c) => c.commitmentId === commitment.id && c.date === today
      );
      const isCompletedToday = todayCompletion?.completed === true;
      
      // Calculate streak from completions
      let streak = 0;
      let currentDate = new Date();
      while (true) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const completion = loadedCompletions.find(
          (c) => c.commitmentId === commitment.id && c.date === dateStr && c.completed
        );
        if (completion?.completed) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      return {
        ...commitment,
        completed: isCompletedToday, // Explicitly set based on today's completion status
        streak,
      };
    });

    setCommitments(updatedCommitments);
  }, [userId, STORAGE_KEY_COMMITMENTS, STORAGE_KEY_COMPLETIONS, user?.id]);

  // Load from localStorage on mount and when user changes
  useEffect(() => {
    // Clear commitments and completions first when user changes
    setCommitments([]);
    setCompletions([]);
    
    loadCommitments();
  }, [loadCommitments]);

  // Listen for new shared commitments and reload when page becomes visible
  useEffect(() => {
    if (typeof window === 'undefined' || !user?.id || userId === 'anonymous') {
      return;
    }

    // Reload commitments when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadCommitments();
      }
    };

    // Reload commitments when window gains focus
    const handleFocus = () => {
      loadCommitments();
    };

    // Listen for custom event when commitments are shared
    const handleCommitmentShared = () => {
      loadCommitments();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('commitmentShared', handleCommitmentShared);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('commitmentShared', handleCommitmentShared);
    };
  }, [loadCommitments, user?.id, userId]);

  // Save to localStorage whenever commitments or completions change
  useEffect(() => {
    // Only save if we have a real user ID
    if (!user?.id || userId === 'anonymous') {
      return;
    }
    
    if (commitments.length > 0) {
      localStorage.setItem(STORAGE_KEY_COMMITMENTS, JSON.stringify(commitments));
    } else {
      // Clear storage if commitments array is empty
      localStorage.removeItem(STORAGE_KEY_COMMITMENTS);
    }
  }, [commitments, STORAGE_KEY_COMMITMENTS, user?.id, userId]);

  useEffect(() => {
    // Only save if we have a real user ID
    if (!user?.id || userId === 'anonymous') {
      return;
    }
    
    if (completions.length > 0) {
      localStorage.setItem(STORAGE_KEY_COMPLETIONS, JSON.stringify(completions));
    } else {
      // Clear storage if completions array is empty
      localStorage.removeItem(STORAGE_KEY_COMPLETIONS);
    }
  }, [completions, STORAGE_KEY_COMPLETIONS, user?.id, userId]);


  // Helper function to share a commitment with all members of specified groups
  const shareCommitmentWithGroupMembers = (commitment: Commitment, groupIdsToShare: string[]) => {
    if (typeof window === 'undefined' || groupIdsToShare.length === 0) return;
    
    console.log('🔄 Sharing commitment with groups:', groupIdsToShare);
    
    // Search all users' localStorage for groups
    const allStorageKeys = Object.keys(localStorage);
    const groupKeys = allStorageKeys.filter(key => key.startsWith('nudgeup_groups_'));
    
    const membersToNotify = new Set<string>(); // Track members who received the commitment
    
    for (const groupId of groupIdsToShare) {
      console.log(`📦 Finding members for group: ${groupId}`);
      
      // Collect all unique members from all instances of this group
      const uniqueMembers = new Map<string, { id: string; userId: string }>();
      
      // Find the group in any user's storage
      for (const key of groupKeys) {
        try {
          const storedGroups = localStorage.getItem(key);
          if (storedGroups) {
            const parsedGroups = JSON.parse(storedGroups);
            if (Array.isArray(parsedGroups)) {
              const group = parsedGroups.find((g: any) => g.id === groupId);
              if (group && group.memberList) {
                // Extract user ID from the storage key (format: nudgeup_groups_${userId})
                const storageUserId = key.replace('nudgeup_groups_', '');
                
                // For each member, map 'current-user' to actual user ID
                for (const member of group.memberList) {
                  const actualMemberId = member.id === 'current-user' ? storageUserId : member.id;
                  
                  // Skip current user (they already have the commitment)
                  if (actualMemberId === userId) {
                    continue;
                  }
                  
                  // Store unique members (by actual user ID)
                  if (!uniqueMembers.has(actualMemberId)) {
                    uniqueMembers.set(actualMemberId, { id: actualMemberId, userId: storageUserId });
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn('Error reading groups from localStorage:', e);
        }
      }
      
      console.log(`👥 Found ${uniqueMembers.size} unique members in group`);
      
      // Share commitment with each unique member
      for (const [actualMemberId, memberInfo] of uniqueMembers) {
        try {
          // Get the member's commitments
          const memberCommitmentsKey = `nudgeup_commitments_${actualMemberId}`;
          const storedMemberCommitments = localStorage.getItem(memberCommitmentsKey);
          const memberCommitments: Commitment[] = storedMemberCommitments 
            ? JSON.parse(storedMemberCommitments) 
            : [];
          
          // Check if member already has this commitment (by name and group)
          const alreadyHasCommitment = memberCommitments.some(c => 
            c.name === commitment.name && c.groupIds?.includes(groupId)
          );
          
          if (!alreadyHasCommitment) {
            console.log(`➕ Adding "${commitment.name}" to member ${actualMemberId}`);
            
            // Create a new commitment for the member
            const newCommitment: Commitment = {
              ...commitment,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Unique ID
              createdAt: new Date().toISOString(),
              streak: 0,
              completed: false,
              groupIds: [groupId, ...(commitment.groupIds || []).filter(id => id !== groupId)],
              weeklyStreak: commitment.frequencyType === 'weekly' ? 0 : undefined,
            };
            
            // Add to member's commitments
            memberCommitments.push(newCommitment);
            localStorage.setItem(memberCommitmentsKey, JSON.stringify(memberCommitments));
            
            membersToNotify.add(actualMemberId);
            console.log(`✅ Added commitment to member ${actualMemberId}`);
          } else {
            console.log(`⏭️ Member ${actualMemberId} already has this commitment`);
          }
        } catch (e) {
          console.warn(`Error adding commitment to member ${actualMemberId}:`, e);
        }
      }
    }
    
    // Dispatch event to notify all users that a commitment was shared
    // This will trigger a reload in other users' contexts
    if (membersToNotify.size > 0) {
      console.log(`📢 Notifying ${membersToNotify.size} members about new shared commitment`);
      window.dispatchEvent(new CustomEvent('commitmentShared', { 
        detail: { groupIds: groupIdsToShare, memberIds: Array.from(membersToNotify) }
      }));
    }
  };

  const addCommitment = (commitmentData: Omit<Commitment, 'id' | 'createdAt' | 'streak' | 'completed'>) => {
    const newCommitment: Commitment = {
      ...commitmentData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      streak: 0,
      completed: false,
      frequencyType: commitmentData.frequencyType || 'daily', // Default to 'daily' if not provided
      timesPerWeek: commitmentData.timesPerWeek,
      weeklyStreak: commitmentData.frequencyType === 'weekly' ? 0 : undefined,
    };
    setCommitments((prev) => [...prev, newCommitment]);
    
    // If the commitment is added with groupIds, share it with all group members
    if (commitmentData.groupIds && commitmentData.groupIds.length > 0) {
      // Use setTimeout to ensure the commitment is added to state first
      setTimeout(() => {
        shareCommitmentWithGroupMembers(newCommitment, commitmentData.groupIds || []);
      }, 100);
    }
  };

  const updateCommitment = (id: string, updates: Partial<Commitment>) => {
    const commitment = commitments.find(c => c.id === id);
    if (!commitment) return;
    
    // Check if groupIds are being updated
    if (updates.groupIds && Array.isArray(updates.groupIds)) {
      const oldGroupIds = commitment.groupIds || [];
      const newGroupIds = updates.groupIds;
      
      // Find newly added group IDs (groups that weren't in the old list)
      const newlyAddedGroupIds = newGroupIds.filter(groupId => !oldGroupIds.includes(groupId));
      
      // For each newly added group, share this commitment with all existing members
      if (newlyAddedGroupIds.length > 0) {
        const updatedCommitment = { ...commitment, ...updates };
        shareCommitmentWithGroupMembers(updatedCommitment, newlyAddedGroupIds);
      }
    }
    
    // Update the commitment in the current user's state
    setCommitments((prev) =>
      prev.map((commitment) => (commitment.id === id ? { ...commitment, ...updates } : commitment))
    );
  };

  const deleteCommitment = (id: string) => {
    setCommitments((prev) => prev.filter((commitment) => commitment.id !== id));
    // Also remove related completions
    setCompletions((prev) => prev.filter((completion) => completion.commitmentId !== id));
  };

  const toggleCommitmentCompletion = (commitmentId: string, date?: string) => {
    // Create date string in YYYY-MM-DD format without timezone conversion
    let targetDate: string;
    if (date) {
      targetDate = date;
    } else {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      targetDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    
    const existingCompletion = completions.find(
      (c) => c.commitmentId === commitmentId && c.date === targetDate
    );

    if (existingCompletion) {
      // Toggle existing completion - flip the boolean value
      setCompletions((prev) =>
        prev.map((c) =>
          c.commitmentId === commitmentId && c.date === targetDate
            ? { ...c, completed: !c.completed }
            : c
        )
      );
    } else {
      // Add new completion - explicitly set completed to true
      setCompletions((prev) => [...prev, { commitmentId, date: targetDate, completed: true }]);
    }

    // Update commitment's completed status for today
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    const todayStr = `${todayYear}-${String(todayMonth).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
    
    // Determine if the task is being completed (not uncompleted)
    const isCompleted = existingCompletion ? !existingCompletion.completed : true;
    
    // Update commitment's completed status for today (if it's today's date)
    if (!date || date === todayStr) {
      console.log('🔄 Toggling commitment completion:', {
        commitmentId,
        isCompleted,
        existingCompletion: existingCompletion?.completed,
        date,
        todayStr,
      });
      updateCommitment(commitmentId, { completed: isCompleted });

      // Update streak based on frequency type
      const commitment = commitments.find(c => c.id === commitmentId);
      if (commitment?.frequencyType === 'weekly') {
        // Update weekly streak for weekly habits
        const weeklyStreak = getWeeklyStreak(commitmentId);
        updateCommitment(commitmentId, { weeklyStreak });
      } else {
        // Update daily streak for daily habits
        if (isCompleted) {
          const streak = getCommitmentStreak(commitmentId);
          updateCommitment(commitmentId, { streak });
        } else {
          // If unchecking today, recalculate streak
          const streak = getCommitmentStreak(commitmentId);
          updateCommitment(commitmentId, { streak });
        }
      }
    }
  };

  const getCompletionForDate = (commitmentId: string, date: string): boolean => {
    // Check if the date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    dateObj.setHours(0, 0, 0, 0);
    
    // If date is in the future, return false (no completions possible for future dates)
    if (dateObj > today) {
      return false;
    }

    const completion = completions.find((c) => c.commitmentId === commitmentId && c.date === date);
    return completion?.completed || false;
  };

  const getCompletionPercentageForDate = useCallback((
    date: string
  ): 'none' | '25%' | '50%' | '75%' | '100%' => {
    if (commitments.length === 0) return 'none';

    // Check if the date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    dateObj.setHours(0, 0, 0, 0);
    
    // If date is in the future, return 'none' (no completions possible for future dates)
    if (dateObj > today) {
      return 'none';
    }

    // Filter commitments to only include:
    // 1. Those created on or before the target date
    // 2. Daily commitments only (exclude weekly commitments from daily completion)
    const commitmentsForDate = commitments.filter((commitment) => {
      const [createdYear, createdMonth, createdDay] = commitment.createdAt.split('T')[0].split('-').map(Number);
      const createdDate = new Date(createdYear, createdMonth - 1, createdDay);
      createdDate.setHours(0, 0, 0, 0);
      const wasCreatedBeforeDate = createdDate <= dateObj;
      const isDailyCommitment = !commitment.frequencyType || commitment.frequencyType === 'daily';
      return wasCreatedBeforeDate && isDailyCommitment;
    });

    if (commitmentsForDate.length === 0) return 'none';

    const completedCount = commitmentsForDate.filter((commitment) => {
      const completion = completions.find(
        (c) => c.commitmentId === commitment.id && c.date === date
      );
      // Check if completion exists and is explicitly marked as completed (true)
      const isCompleted = completion !== undefined && completion.completed === true;
      
      // Debug: Log for today's date in development
      if (process.env.NODE_ENV === 'development') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (date === todayStr) {
          console.log(`[Calendar] ${commitment.name}: completion=${!!completion}, completed=${completion?.completed}, isCompleted=${isCompleted}`);
        }
      }
      
      return isCompleted;
    }).length;

    const percentage = (completedCount / commitmentsForDate.length) * 100;

    if (percentage === 0) return 'none';
    if (percentage <= 25) return '25%';
    if (percentage <= 50) return '50%';
    if (percentage <= 75) return '75%';
    return '100%';
  }, [commitments, completions]);

  const getCommitmentStreak = useCallback((commitmentId: string): number => {
    const commitment = commitments.find(c => c.id === commitmentId);
    if (!commitment) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get the date when the commitment was created
    const [createdYear, createdMonth, createdDay] = commitment.createdAt.split('T')[0].split('-').map(Number);
    const createdDate = new Date(createdYear, createdMonth - 1, createdDay);
    createdDate.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);

    // Check backwards from today
    while (true) {
      // Don't count dates before the commitment was created
      if (currentDate < createdDate) {
        break;
      }
      
      // Use consistent YYYY-MM-DD format (same as completions storage)
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const completion = completions.find(
        (c) => c.commitmentId === commitmentId && c.date === dateStr && c.completed
      );

      if (completion?.completed) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
        currentDate.setHours(0, 0, 0, 0);
      } else {
        // If today is not completed, don't count it in the streak
        // Only count completed days in the past
        break;
      }
    }

    return streak;
  }, [completions, commitments]);

  const getWeeklyCompletionCount = (commitmentId: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get the day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = today.getDay();
    
    // Calculate Sunday of current week
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);
    
    // Count completions from Sunday to today
    let count = 0;
    for (let i = 0; i <= dayOfWeek; i++) {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const completion = completions.find(
        (c) => c.commitmentId === commitmentId && c.date === dateStr && c.completed
      );
      if (completion?.completed) {
        count++;
      }
    }
    
    return count;
  };

  const getWeeklyStreak = (commitmentId: string): number => {
    const commitment = commitments.find(c => c.id === commitmentId);
    if (!commitment || commitment.frequencyType !== 'weekly' || !commitment.timesPerWeek) {
      return 0;
    }
    
    const timesPerWeek = commitment.timesPerWeek;
    let streak = 0;
    let currentWeekStart = new Date();
    currentWeekStart.setHours(0, 0, 0, 0);
    
    // Get the day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = currentWeekStart.getDay();
    
    // Calculate Sunday of current week
    let weekSunday = new Date(currentWeekStart);
    weekSunday.setDate(currentWeekStart.getDate() - dayOfWeek);
    
    // Check backwards week by week
    while (true) {
      // Count completions for this week
      let weekCount = 0;
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekSunday);
        date.setDate(weekSunday.getDate() + i);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const completion = completions.find(
          (c) => c.commitmentId === commitmentId && c.date === dateStr && c.completed
        );
        if (completion?.completed) {
          weekCount++;
        }
      }
      
      // If this week met the goal, increment streak and check previous week
      if (weekCount >= timesPerWeek) {
        streak++;
        // Move to previous week (create new date to avoid mutation)
        weekSunday = new Date(weekSunday);
        weekSunday.setDate(weekSunday.getDate() - 7);
      } else {
        break;
      }
    }

    return streak;
  };

  return (
    <CommitmentsContext.Provider
      value={{
        commitments,
        completions,
        addCommitment,
        updateCommitment,
        deleteCommitment,
        toggleCommitmentCompletion,
        getCompletionForDate,
        getCompletionPercentageForDate,
        getCommitmentStreak,
        getWeeklyCompletionCount,
        getWeeklyStreak,
      }}
    >
      {children}
    </CommitmentsContext.Provider>
  );
}

export function useCommitments() {
  const context = useContext(CommitmentsContext);
  if (context === undefined) {
    throw new Error('useCommitments must be used within a CommitmentsProvider');
  }
  return context;
}

