// Core data types for the application

export interface Commitment {
  id: string;
  name: string;
  icon: string;
  streak: number;
  completed: boolean;
  createdAt: string; // ISO date string
  duration?: number; // Optional challenge duration in days
  groupIds?: string[]; // Array of group IDs if commitment is shared with groups
  frequencyType?: 'daily' | 'weekly'; // Frequency type: daily (default) or weekly
  timesPerWeek?: number; // For weekly habits: how many times per week (e.g., 3)
  weeklyStreak?: number; // For weekly habits: consecutive weeks completed
}

export interface CommitmentCompletion {
  commitmentId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  completed: boolean;
}

export interface Group {
  id: string;
  name: string;
  icon: string;
  members: number;
  daysLeft: number;
  yourProgress: number;
  groupAverage: number;
  isAhead: boolean;
  description?: string;
  challengeDuration?: string;
  totalDays?: number;
  inviteCode?: string;
  memberList?: GroupMember[]; // List of actual members who joined the group
}

export interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  completedToday: boolean;
  streak: number;
  memberSince?: string;
  currentStreak?: number;
  longestStreak?: number;
  activeHabits?: number;
  todayCompleted?: number;
  todayTotal?: number;
  weeklyData?: WeeklyData[];
  sharedCommitments?: Commitment[];
  achievements?: Achievement[];
}

export interface WeeklyData {
  day: string;
  completed: number;
  total: number;
  isToday?: boolean;
}

export interface Achievement {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  avatarImage?: string;
  createdAt?: number; // Timestamp when account was created
  memberSince?: string; // Formatted date string (for display)
}

export interface CalendarDay {
  date: number;
  completion: 'none' | '25%' | '50%' | '75%' | '100%';
  isToday?: boolean;
}

