'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Group, GroupMember } from '@/types';

interface GroupsContextType {
  groups: Group[];
  getUserGroups: () => Group[];
  createGroup: (groupData: Omit<Group, 'id' | 'members' | 'daysLeft' | 'yourProgress' | 'groupAverage' | 'isAhead' | 'inviteCode' | 'memberList'>) => Group;
  deleteGroup: (groupId: string) => void;
  getGroupMembers: (groupId: string) => GroupMember[];
  addMemberToGroup: (groupId: string, member: GroupMember) => void;
  removeMemberFromGroup: (groupId: string, memberId: string) => void;
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

const STORAGE_KEY_GROUPS = 'nudgeup_groups';

export function GroupsProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);

  // Get current user info from localStorage
  const getCurrentUser = (): GroupMember => {
    const userName = localStorage.getItem('nudgeup_userName') || 'You';
    const userAvatar = localStorage.getItem('nudgeup_userAvatar') || '😊';
    return {
      id: 'current-user',
      name: userName,
      avatar: userAvatar,
      completedToday: false,
      streak: 0,
      memberSince: new Date().toISOString(),
    };
  };

  // Load from localStorage on mount
  useEffect(() => {
    const storedGroups = localStorage.getItem(STORAGE_KEY_GROUPS);
    
    if (storedGroups) {
      try {
        const loadedGroups = JSON.parse(storedGroups);
        setGroups(loadedGroups);
      } catch (e) {
        console.error('Error loading groups from localStorage:', e);
      }
    } else {
      // Get current user
      const currentUser = getCurrentUser();
      
      // Initialize with default groups (with mock members for testing)
      const mockMembers: GroupMember[] = [
        {
          id: 'member-1',
          name: 'Alex',
          avatar: '👨',
          completedToday: false,
          streak: 12,
          memberSince: new Date().toISOString(),
        },
        {
          id: 'member-2',
          name: 'Sarah',
          avatar: '👩',
          completedToday: true,
          streak: 8,
          memberSince: new Date().toISOString(),
        },
        {
          id: 'member-3',
          name: 'Mike',
          avatar: '🧑',
          completedToday: false,
          streak: 15,
          memberSince: new Date().toISOString(),
        },
      ];

      const defaultGroups: Group[] = [
        {
          id: '1',
          name: '30-Day Meditation Challenge',
          icon: '🧘',
          members: 4, // Current user + 3 mock members
          daysLeft: 15,
          yourProgress: 15,
          groupAverage: 13,
          isAhead: true,
          inviteCode: 'MEDIT001',
          memberList: [currentUser, ...mockMembers],
        },
        {
          id: '2',
          name: 'Morning Routine Warriors',
          icon: '☀️',
          members: 4, // Current user + 3 mock members
          daysLeft: 7,
          yourProgress: 23,
          groupAverage: 20,
          isAhead: true,
          inviteCode: 'MORNING001',
          memberList: [currentUser, ...mockMembers],
        },
      ];
      setGroups(defaultGroups);
      localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(defaultGroups));
    }
  }, []);

  // Save to localStorage whenever groups change
  useEffect(() => {
    if (groups.length > 0) {
      localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups));
    }
  }, [groups]);

  const getUserGroups = () => {
    return groups;
  };

  const createGroup = (groupData: Omit<Group, 'id' | 'members' | 'daysLeft' | 'yourProgress' | 'groupAverage' | 'isAhead' | 'inviteCode' | 'memberList'>): Group => {
    const currentUser = getCurrentUser();
    const newGroup: Group = {
      ...groupData,
      id: Date.now().toString(),
      members: 1, // Creator is the first member
      daysLeft: groupData.totalDays || 30, // Default 30 days if no duration specified
      yourProgress: 0,
      groupAverage: 0,
      isAhead: false,
      inviteCode: `GRP${Date.now().toString().slice(-6).toUpperCase()}`,
      memberList: [currentUser], // Add creator as first member
    };
    setGroups((prev) => [...prev, newGroup]);
    return newGroup;
  };

  const deleteGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((group) => group.id !== groupId));
  };

  const getGroupMembers = (groupId: string): GroupMember[] => {
    const group = groups.find(g => g.id === groupId);
    return group?.memberList || [];
  };

  const addMemberToGroup = (groupId: string, member: GroupMember) => {
    setGroups((prev) =>
      prev.map((group) => {
        if (group.id === groupId) {
          // Check if member already exists
          const existingMember = group.memberList?.find(m => m.id === member.id);
          if (existingMember) {
            return group; // Don't add duplicate
          }
          return {
            ...group,
            members: (group.members || 0) + 1,
            memberList: [...(group.memberList || []), member],
          };
        }
        return group;
      })
    );
  };

  const removeMemberFromGroup = (groupId: string, memberId: string) => {
    setGroups((prev) =>
      prev.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            members: Math.max(0, (group.members || 0) - 1),
            memberList: (group.memberList || []).filter(m => m.id !== memberId),
          };
        }
        return group;
      })
    );
  };

  return (
    <GroupsContext.Provider value={{ groups, getUserGroups, createGroup, deleteGroup, getGroupMembers, addMemberToGroup, removeMemberFromGroup }}>
      {children}
    </GroupsContext.Provider>
  );
}

export function useGroups() {
  const context = useContext(GroupsContext);
  if (context === undefined) {
    throw new Error('useGroups must be used within a GroupsProvider');
  }
  return context;
}

