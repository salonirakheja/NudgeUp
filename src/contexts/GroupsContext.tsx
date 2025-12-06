'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Group, GroupMember } from '@/types';
import { useAuthContext } from '@/contexts/AuthContext';

interface GroupsContextType {
  groups: Group[];
  getUserGroups: () => Group[];
  createGroup: (groupData: Omit<Group, 'id' | 'members' | 'daysLeft' | 'yourProgress' | 'groupAverage' | 'isAhead' | 'inviteCode' | 'memberList'>) => Group;
  addGroup: (group: Group) => void; // Add method to add an existing group
  deleteGroup: (groupId: string) => void;
  getGroupMembers: (groupId: string) => GroupMember[];
  addMemberToGroup: (groupId: string, member: GroupMember) => void;
  removeMemberFromGroup: (groupId: string, memberId: string) => void;
  reloadGroups: () => void; // Add method to reload groups from localStorage
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

export function GroupsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const userId = user?.id || 'anonymous';
  
  // Use user-specific storage key
  const STORAGE_KEY_GROUPS = `nudgeup_groups_${userId}`;
  
  const [groups, setGroups] = useState<Group[]>([]);

  // Get current user info from localStorage
  // Use 'userName' and 'userAvatar' (from profile page) instead of 'nudgeup_userName'
  const getCurrentUser = (): GroupMember => {
    const userName = localStorage.getItem('userName') || 'You';
    const userAvatar = localStorage.getItem('userAvatar') || '😊';
    return {
      id: 'current-user',
      name: userName,
      avatar: userAvatar,
      completedToday: false,
      streak: 0,
      memberSince: new Date().toISOString(),
    };
  };

  // Listen for profile updates and update member names/avatars in all groups
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      const { name, avatar, avatarImage } = event.detail || {};
      if (!name && !avatar && !avatarImage) return;
      
      // If avatarImage is provided, use it; otherwise use avatar (emoji)
      const updatedAvatar = avatarImage || avatar;
      
      console.log('🔄 Profile updated, updating member info in all groups:', { name, avatar, avatarImage, updatedAvatar, userId });
      
      // Update all groups where current user is a member (in current user's localStorage)
      setGroups((prev) => {
        const updatedGroups = prev.map((group) => {
          if (!group.memberList) return group;
          
          const updatedMemberList = group.memberList.map((member) => {
            // Update current user's info in this group
            if (member.id === userId || member.id === 'current-user') {
              const updatedMember = {
                ...member,
                id: userId, // Ensure we use actual user ID
                name: name || member.name, // Update name if provided
                avatar: updatedAvatar || member.avatar, // Update avatar (use avatarImage if available, otherwise emoji)
              };
              console.log('🔄 Updating member in group:', group.name, 'Old avatar:', member.avatar, 'New avatar:', updatedAvatar, 'Final avatar:', updatedMember.avatar);
              return updatedMember;
            }
            return member;
          });
          
          return {
            ...group,
            memberList: updatedMemberList,
          };
        });
        
        // Save updated groups to localStorage immediately
        if (updatedGroups.length > 0) {
          localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(updatedGroups));
          console.log('✅ Saved updated groups to localStorage with new avatar');
        }
        
        return updatedGroups;
      });
      
      // Also update current user's member info in OTHER users' groups
      // This ensures that when other users view groups, they see the updated name/avatar
      const allStorageKeys = Object.keys(localStorage);
      const groupKeys = allStorageKeys.filter(key => key.startsWith('nudgeup_groups_'));
      
      for (const key of groupKeys) {
        // Skip current user's own groups (already updated above)
        if (key === STORAGE_KEY_GROUPS) continue;
        
        try {
          const storedGroups = localStorage.getItem(key);
          if (storedGroups) {
            const parsedGroups = JSON.parse(storedGroups);
            if (Array.isArray(parsedGroups)) {
              let updated = false;
              const updatedGroups = parsedGroups.map((group: any) => {
                if (!group.memberList) return group;
                
                const updatedMemberList = group.memberList.map((member: any) => {
                  // Update current user's info if they're a member of this group
                  // Also check for 'current-user' ID in case it wasn't converted yet
                  if (member.id === userId || member.id === 'current-user') {
                    updated = true;
                    return {
                      ...member,
                      id: userId, // Always use actual user ID
                      name: name || member.name, // Use new name if provided, otherwise keep existing
                      avatar: updatedAvatar || member.avatar, // Use new avatar (avatarImage if available, otherwise emoji)
                    };
                  }
                  return member;
                });
                
                if (updated) {
                  return {
                    ...group,
                    memberList: updatedMemberList,
                  };
                }
                return group;
              });
              
              if (updated) {
                localStorage.setItem(key, JSON.stringify(updatedGroups));
                console.log('✅ Updated member info in other user\'s groups:', key);
              }
            }
          }
        } catch (e) {
          console.warn('Error updating member info in', key, e);
        }
      }
    };
    
    // Listen for profile update events
    window.addEventListener('avatarUpdated', handleProfileUpdate as EventListener);
    
    return () => {
      window.removeEventListener('avatarUpdated', handleProfileUpdate as EventListener);
    };
  }, [userId, user?.id, STORAGE_KEY_GROUPS]);

  // Load from localStorage on mount and when user changes
  useEffect(() => {
    // Clear groups first when user changes
    setGroups([]);
    
    // Only load if we have a real user ID (not anonymous)
    if (!user?.id || userId === 'anonymous') {
      return;
    }
    
    const storedGroups = localStorage.getItem(STORAGE_KEY_GROUPS);
    
    if (storedGroups) {
      try {
        const loadedGroups = JSON.parse(storedGroups);
        
        // Clean up duplicate members in all groups
        const cleanedGroups = loadedGroups.map((group: Group) => {
          if (!group.memberList || group.memberList.length === 0) {
            return group;
          }
          
          // Deduplicate members
          const seenIds = new Set<string>();
          const uniqueMembers: GroupMember[] = [];
          
          for (const member of group.memberList) {
            // If member has 'current-user' ID, convert to actual user ID
            if (member.id === 'current-user') {
              if (!seenIds.has(userId)) {
                seenIds.add(userId);
                uniqueMembers.push({
                  ...member,
                  id: userId, // Convert to actual user ID
                });
              }
              continue;
            }
            
            // For members with actual IDs, check for duplicates
            if (!seenIds.has(member.id)) {
              seenIds.add(member.id);
              uniqueMembers.push(member);
            }
          }
          
          return {
            ...group,
            memberList: uniqueMembers,
            members: uniqueMembers.length, // Update count to match actual members
          };
        });
        
        setGroups(cleanedGroups);
        
        // Save cleaned groups back to localStorage
        if (cleanedGroups.length > 0) {
          localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(cleanedGroups));
        }
      } catch (e) {
        console.error('Error loading groups from localStorage:', e);
      }
    }
    // New users start with empty groups - they can create their own
  }, [userId, STORAGE_KEY_GROUPS, user?.id]);

  // Save to localStorage whenever groups change
  useEffect(() => {
    // Only save if we have a real user ID
    if (!user?.id || userId === 'anonymous') {
      return;
    }
    
    if (groups.length > 0) {
      localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups));
    } else {
      // Clear storage if groups array is empty
      localStorage.removeItem(STORAGE_KEY_GROUPS);
    }
  }, [groups, STORAGE_KEY_GROUPS, user?.id, userId]);

  const getUserGroups = () => {
    return groups;
  };

  const createGroup = (groupData: Omit<Group, 'id' | 'members' | 'daysLeft' | 'yourProgress' | 'groupAverage' | 'isAhead' | 'inviteCode' | 'memberList'>): Group => {
    const currentUser = getCurrentUser();
    // Use actual user ID instead of 'current-user' for storage
    const currentUserId = user?.id || 'anonymous';
    const creatorMember: GroupMember = {
      ...currentUser,
      id: currentUserId, // Use actual user ID, not 'current-user'
    };
    const newGroup: Group = {
      ...groupData,
      id: Date.now().toString(),
      members: 1, // Creator is the first member
      daysLeft: groupData.totalDays || 30, // Default 30 days if no duration specified
      yourProgress: 0,
      groupAverage: 0,
      isAhead: false,
      inviteCode: `GRP${Date.now().toString().slice(-6).toUpperCase()}`,
      memberList: [creatorMember], // Add creator as first member
    };
    setGroups((prev) => [...prev, newGroup]);
    return newGroup;
  };

  const addGroup = (group: Group) => {
    // Check if group already exists using functional update to avoid stale state
    setGroups((prev) => {
      const exists = prev.some(g => g.id === group.id);
      if (!exists) {
        return [...prev, group];
      }
      return prev;
    });
  };

  const reloadGroups = () => {
    // Reload groups from localStorage
    if (!user?.id || userId === 'anonymous') {
      return;
    }
    const storedGroups = localStorage.getItem(STORAGE_KEY_GROUPS);
    if (storedGroups) {
      try {
        const loadedGroups = JSON.parse(storedGroups);
        setGroups(loadedGroups);
      } catch (e) {
        console.error('Error reloading groups from localStorage:', e);
      }
    } else {
      setGroups([]);
    }
  };

  const deleteGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((group) => group.id !== groupId));
  };

  const getGroupMembers = (groupId: string): GroupMember[] => {
    // Aggregate members from ALL users' localStorage for this group
    // This ensures we see all members, not just the current user's copy
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      // During SSR, return members from current user's groups only
      const currentUserGroup = groups.find(g => g.id === groupId);
      if (currentUserGroup?.memberList) {
        return currentUserGroup.memberList.map(member => ({
          ...member,
          id: member.id === 'current-user' ? userId : member.id,
          name: member.id === 'current-user' ? (member.name || 'You') : member.name,
        }));
      }
      return [];
    }
    
    const allStorageKeys = Object.keys(localStorage);
    const groupKeys = allStorageKeys.filter(key => key.startsWith('nudgeup_groups_'));
    const allMembersMap = new Map<string, GroupMember>(); // Use Map to deduplicate by member ID
    
    // First, get members from current user's group (this will have the most up-to-date info)
    const currentUserGroup = groups.find(g => g.id === groupId);
    if (currentUserGroup?.memberList) {
      for (const member of currentUserGroup.memberList) {
        const memberId = member.id === 'current-user' ? userId : member.id;
        if (!allMembersMap.has(memberId)) {
          // If this is the current user, always use their current profile name
          const memberName = memberId === userId 
            ? (localStorage.getItem('userName') || member.name || 'You') // Always use current profile name
            : member.name;
          
          allMembersMap.set(memberId, {
            ...member,
            id: memberId, // Ensure we use actual user ID, not 'current-user'
            name: memberName, // Use actual name (current profile name for current user)
            avatar: memberId === userId 
              ? (localStorage.getItem('userAvatar') || member.avatar || '😊') // Use current profile avatar
              : member.avatar,
          });
        }
      }
    }
    
    // Then, get members from all other users' groups
    for (const key of groupKeys) {
      try {
        const storedGroups = localStorage.getItem(key);
        if (storedGroups) {
          const parsedGroups = JSON.parse(storedGroups);
          if (Array.isArray(parsedGroups)) {
            const otherUserGroup = parsedGroups.find((g: any) => g.id === groupId);
            if (otherUserGroup?.memberList) {
              // Extract user ID from storage key (format: nudgeup_groups_${userId})
              const otherUserId = key.replace('nudgeup_groups_', '');
              
              for (const member of otherUserGroup.memberList) {
                // Convert 'current-user' to actual user ID for that user
                const memberId = member.id === 'current-user' ? otherUserId : member.id;
                
                // Skip if this is the current user (we already have them from our own group)
                if (memberId === userId) {
                  continue;
                }
                
                if (!allMembersMap.has(memberId)) {
                  // Use the member's stored name - it should be their actual profile name when they joined
                  // IMPORTANT: The member object should have the correct name stored when they joined
                  // We should preserve it exactly as stored - don't change it unless it's truly missing
                  
                  // Debug logging to see what name is stored
                  console.log('🔍 Reading member from storage:', {
                    storageKey: key,
                    otherUserId,
                    memberId,
                    storedMemberId: member.id,
                    storedName: member.name,
                    storedAvatar: member.avatar,
                  });
                  
                  // Preserve the name exactly as stored - it should be their profile name
                  // IMPORTANT: The member object should have the correct name when they joined
                  // We should use whatever name is stored, even if it's 'You'
                  // Only use fallback if name is truly missing (null/undefined/empty string)
                  
                  // Use the member's stored name - it should be their actual profile name when they joined
                  // IMPORTANT: The member should have their actual profile name stored when they joined
                  // If the name is "You", it means they joined before setting their profile
                  // The profile update mechanism should have updated this, but if it hasn't, we'll use the stored name
                  let memberName = member.name;
                  
                  // Only use fallback if name is completely missing
                  // If name is "You", we'll keep it as "You" - the profile update should fix it
                  // But actually, we should convert "You" to a fallback for other members
                  if (!memberName || memberName.trim() === '') {
                    memberName = `User ${otherUserId.slice(0, 8)}`;
                    console.warn('⚠️ Member name is missing, using fallback:', memberName);
                  } else if (memberName === 'You') {
                    // If name is "You" for another member, convert to fallback
                    // "You" should only be used for the current user
                    memberName = `User ${otherUserId.slice(0, 8)}`;
                    console.warn('⚠️ Member name is "You" (should be profile name), using fallback:', memberName, 'Member ID:', memberId);
                  } else {
                    // Use the stored name as-is (should be their actual profile name)
                    console.log('✅ Using stored member name:', memberName);
                  }
                  
                  // For other users, use their stored avatar from the member object
                  // This should be updated when they update their profile
                  let memberAvatar = member.avatar;
                  
                  // If avatar is missing, use fallback
                  if (!memberAvatar || memberAvatar.trim() === '') {
                    memberAvatar = '😊';
                    console.warn('⚠️ Member avatar is missing, using fallback:', memberAvatar);
                  }
                  
                  console.log('✅ Reading member avatar from storage:', {
                    memberId,
                    storageKey: key,
                    storedAvatar: member.avatar,
                    finalAvatar: memberAvatar,
                  });
                  
                  allMembersMap.set(memberId, {
                    ...member,
                    id: memberId, // Use actual user ID
                    name: memberName, // Use the stored name (should be their profile name)
                    avatar: memberAvatar, // Use the stored avatar (should be updated when they update their profile)
                  });
                } else {
                  // If we already have this member, prefer the one with a better name (not 'You' or fallback)
                  const existingMember = allMembersMap.get(memberId);
                  const existingIsFallback = existingMember?.name?.startsWith('User ') || existingMember?.name === 'You';
                  const newIsFallback = member.name?.startsWith('User ') || member.name === 'You';
                  
                  // Prefer the one that's NOT a fallback
                  if (existingIsFallback && !newIsFallback && member.name) {
                    allMembersMap.set(memberId, {
                      ...member,
                      id: memberId,
                      name: member.name, // Use the better name
                      avatar: member.avatar || existingMember.avatar || '😊',
                    });
                  } else if (!existingIsFallback && newIsFallback) {
                    // Keep the existing one if it's better
                    // Do nothing
                  } else if (member.name && member.name !== 'You' && existingMember?.name === 'You') {
                    // If existing is 'You' and new one has a real name, use the new one
                    allMembersMap.set(memberId, {
                      ...member,
                      id: memberId,
                      name: member.name,
                      avatar: member.avatar || existingMember.avatar || '😊',
                    });
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn('Error reading groups from', key, e);
      }
    }
    
    // Convert Map to array and map current user's ID to 'current-user' for display
    // IMPORTANT: Only map the current user to 'current-user' and "You"
    // All other members should keep their actual names
    const allMembers = Array.from(allMembersMap.values()).map(member => {
      // Only change the current user's display
      if (member.id === userId) {
        return {
          ...member,
          id: 'current-user', // Map to 'current-user' for UI consistency
          name: 'You', // Display as "You" for current user only
        };
      }
      // For all other members, keep their actual name (don't change to "You")
      // IMPORTANT: Only the current user should show as "You"
      // All other members should show their stored name from when they joined
      // If their stored name is "You", it means they joined before setting their profile
      // In that case, we should show "You" (not a fallback) - the profile update should fix it
      let displayName = member.name;
      
      // If name is "You" for a non-current user, it's incorrect data
      // This means they joined before setting their profile name
      // We should NOT show "You" for other members - we should use a fallback
      // The profile update mechanism should fix this, but if it hasn't, we'll use a fallback
      if (displayName === 'You' && member.id !== userId) {
        // Convert "You" to a fallback for other members
        displayName = `User ${member.id.slice(0, 8)}`;
        console.warn('⚠️ Found member with "You" as name (incorrect), using fallback:', displayName, 'Member ID:', member.id);
      } else if (!displayName || displayName.trim() === '') {
        // Only use fallback if name is completely missing
        displayName = `User ${member.id.slice(0, 8)}`;
        console.warn('⚠️ Member name is missing, using fallback:', displayName);
      }
      
      return {
        ...member,
        // Keep the stored name for all members except current user
        // IMPORTANT: Don't change other members' names to "You"
        name: displayName, // Use stored name (or "You" if that's what was stored)
      };
    });
    
    // Debug: log all members to see what we're returning
    console.log('👥 Final members list:', allMembers.map(m => ({ id: m.id, name: m.name, isCurrentUser: m.id === 'current-user' || m.id === userId })));
    console.log('👤 Current userId:', userId);
    
    // Don't update state during render - this causes React errors
    // The member list will be updated when groups are saved to localStorage
    // We'll sync it in a useEffect if needed, but for now just return the aggregated list
    
    return allMembers;
  };

  const addMemberToGroup = (groupId: string, member: GroupMember) => {
    setGroups((prev) =>
      prev.map((group) => {
        if (group.id === groupId) {
          // Check if member already exists (by actual user ID, not 'current-user')
          const existingMember = group.memberList?.find(m => m.id === member.id);
          if (existingMember) {
            // Update member count to match actual member list length
            return {
              ...group,
              members: group.memberList?.length || 0,
            };
          }
          const updatedMemberList = [...(group.memberList || []), member];
          return {
            ...group,
            members: updatedMemberList.length, // Use actual count from memberList
            memberList: updatedMemberList,
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
    <GroupsContext.Provider value={{ groups, getUserGroups, createGroup, addGroup, deleteGroup, getGroupMembers, addMemberToGroup, removeMemberFromGroup, reloadGroups }}>
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

