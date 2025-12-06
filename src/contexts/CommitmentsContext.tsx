'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Commitment, CommitmentCompletion } from '@/types';

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
}

const CommitmentsContext = createContext<CommitmentsContextType | undefined>(undefined);

const STORAGE_KEY_COMMITMENTS = 'nudgeup_commitments';
const STORAGE_KEY_COMPLETIONS = 'nudgeup_completions';

export function CommitmentsProvider({ children }: { children: ReactNode }) {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [completions, setCompletions] = useState<CommitmentCompletion[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
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
    } else {
      // Initialize with default commitments if none exist
      loadedCommitments = [
        {
          id: '1',
          name: 'Morning Meditation',
          icon: '🧘',
          streak: 12,
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Drink 8 Glasses of Water',
          icon: '💧',
          streak: 8,
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Read for 30 Minutes',
          icon: '📚',
          streak: 5,
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '4',
          name: 'Evening Workout',
          icon: '💪',
          streak: 15,
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_KEY_COMMITMENTS, JSON.stringify(loadedCommitments));
    }

    if (storedCompletions) {
      try {
        loadedCompletions = JSON.parse(storedCompletions);
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
  }, []);

  // Save to localStorage whenever commitments or completions change
  useEffect(() => {
    if (commitments.length > 0) {
      localStorage.setItem(STORAGE_KEY_COMMITMENTS, JSON.stringify(commitments));
    }
  }, [commitments]);

  useEffect(() => {
    if (completions.length > 0) {
      localStorage.setItem(STORAGE_KEY_COMPLETIONS, JSON.stringify(completions));
    }
  }, [completions]);

  const addCommitment = (commitmentData: Omit<Commitment, 'id' | 'createdAt' | 'streak' | 'completed'>) => {
    const newCommitment: Commitment = {
      ...commitmentData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      streak: 0,
      completed: false,
    };
    setCommitments((prev) => [...prev, newCommitment]);
  };

  const updateCommitment = (id: string, updates: Partial<Commitment>) => {
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
      // Toggle existing completion
      setCompletions((prev) =>
        prev.map((c) =>
          c.commitmentId === commitmentId && c.date === targetDate
            ? { ...c, completed: !c.completed }
            : c
        )
      );
    } else {
      // Add new completion
      setCompletions((prev) => [...prev, { commitmentId, date: targetDate, completed: true }]);
    }

    // Update commitment's completed status for today
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    const todayStr = `${todayYear}-${String(todayMonth).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
    
    if (!date || date === todayStr) {
      const isCompleted = existingCompletion ? !existingCompletion.completed : true;
      updateCommitment(commitmentId, { completed: isCompleted });

      // Update streak
      if (isCompleted) {
        const streak = getCommitmentStreak(commitmentId);
        updateCommitment(commitmentId, { streak });
      } else {
        // If unchecking today, recalculate streak
        const streak = getCommitmentStreak(commitmentId);
        updateCommitment(commitmentId, { streak });
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

  const getCompletionPercentageForDate = (
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

    const completedCount = commitments.filter((commitment) => {
      const completion = completions.find(
        (c) => c.commitmentId === commitment.id && c.date === date && c.completed
      );
      return completion?.completed || false;
    }).length;

    const percentage = (completedCount / commitments.length) * 100;

    if (percentage === 0) return 'none';
    if (percentage <= 25) return '25%';
    if (percentage <= 50) return '50%';
    if (percentage <= 75) return '75%';
    return '100%';
  };

  const getCommitmentStreak = (commitmentId: string): number => {
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);

    // Check backwards from today
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const completion = completions.find(
        (c) => c.commitmentId === commitmentId && c.date === dateStr && c.completed
      );

      if (completion?.completed) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
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

