'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGroups } from '@/contexts/GroupsContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCommitments } from '@/contexts/CommitmentsContext';
import { Commitment } from '@/types';
import { queryOnce } from '@/lib/instant';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (codeOrLink: string) => void;
}

export const JoinGroupModal = ({ isOpen, onClose, onJoin }: JoinGroupModalProps) => {
  const [codeOrLink, setCodeOrLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { groups, getUserGroups, addMemberToGroup, addGroup, reloadGroups } = useGroups();
  const { user } = useAuthContext();
  const { addCommitment, commitments: userCommitments } = useCommitments();

  if (!isOpen) return null;

  const extractInviteCode = (input: string): string => {
    const trimmed = input.trim();
    
    // If it's a URL, extract the code from the path
    if (trimmed.includes('/join/')) {
      const parts = trimmed.split('/join/');
      return parts[parts.length - 1].split('?')[0].split('#')[0];
    }
    
    // If it's just a code, return it
    return trimmed.toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!codeOrLink.trim()) {
      setError('Please enter a group code or link');
      return;
    }

    setIsLoading(true);
    try {
      const inviteCode = extractInviteCode(codeOrLink);
      
      // First try to find in current user's groups (localStorage)
      let allGroups = getUserGroups();
      let group = allGroups.find(g => g.inviteCode === inviteCode);
      
      // If not found in localStorage, try to search in InstantDB (for groups created by other users)
      if (!group) {
        try {
          console.log('Group not found in localStorage, searching InstantDB...');
          const dbGroups = await queryOnce({ groups: {} });
          if (dbGroups?.groups && Array.isArray(dbGroups.groups)) {
            group = dbGroups.groups.find((g: any) => g.inviteCode === inviteCode);
            console.log('Found group in InstantDB:', group ? group.name : 'not found');
          }
        } catch (dbError) {
          console.warn('Error querying InstantDB for groups:', dbError);
          // Continue with localStorage search result
        }
      }
      
      // Also search all localStorage keys for groups (in case groups are stored per-user)
      if (!group) {
        try {
          console.log('Searching all localStorage keys for groups...');
          const allStorageKeys = Object.keys(localStorage);
          const groupKeys = allStorageKeys.filter(key => key.startsWith('nudgeup_groups_'));
          
          for (const key of groupKeys) {
            try {
              const storedGroups = localStorage.getItem(key);
              if (storedGroups) {
                const parsedGroups = JSON.parse(storedGroups);
                if (Array.isArray(parsedGroups)) {
                  const foundGroup = parsedGroups.find((g: any) => g.inviteCode === inviteCode);
                  if (foundGroup) {
                    group = foundGroup;
                    console.log('Found group in localStorage key:', key);
                    break;
                  }
                }
              }
            } catch (e) {
              console.warn('Error parsing groups from', key, e);
            }
          }
        } catch (searchError) {
          console.warn('Error searching localStorage:', searchError);
        }
      }
      
      if (!group) {
        setError('Invalid group code. Please check and try again.');
        setIsLoading(false);
        return;
      }
      
      // Check if user is already a member
      // Use actual user ID instead of 'current-user' for storage
      const currentUserId = user?.id || 'anonymous';
      // Get name from profile (userName) - this is what users set in their profile page
      const profileName = typeof window !== 'undefined' ? (localStorage.getItem('userName') || 'You') : 'You';
      const profileAvatar = typeof window !== 'undefined' ? (localStorage.getItem('userAvatar') || '😊') : '😊';
      
      console.log('👤 Joining group with profile name:', profileName, 'avatar:', profileAvatar);
      
      const currentUser = {
        id: currentUserId, // Use actual user ID, not 'current-user'
        name: profileName, // Use profile name - this should be their actual name from profile
        avatar: profileAvatar, // Use profile avatar
        completedToday: false,
        streak: 0,
        memberSince: new Date().toISOString(),
      };
      
      console.log('👤 Current user object being stored:', JSON.stringify(currentUser, null, 2));
      
      // Check if group exists in current user's groups
      // This is the most reliable way to check membership - if the group is in their list, they're a member
      const userGroups = getUserGroups();
      let userGroup = userGroups.find(g => g.id === group.id || g.inviteCode === inviteCode);
      
      // Check if already a member - only check if group exists in current user's groups
      // Don't check the found group's memberList because 'current-user' is the same for all users
      const isAlreadyMember = !!userGroup;
      
      if (isAlreadyMember) {
        setError('You are already a member of this group.');
        setIsLoading(false);
        return;
      }
      
      // If group doesn't exist in user's groups, we need to add it to their list first
      if (!userGroup) {
        // Create a copy of the group with the current user added as a member
        // Check if member already exists to avoid duplicates
        const existingMemberList = group.memberList || [];
        const memberExists = existingMemberList.some((m: any) => m.id === currentUserId);
        
        const groupToAdd = {
          ...group,
          memberList: memberExists ? existingMemberList : [currentUser, ...existingMemberList],
          members: memberExists ? existingMemberList.length : existingMemberList.length + 1,
        };
        
        // Add the group to the context (which will save to localStorage)
        addGroup(groupToAdd);
        
        // Also update the group in the original user's storage (if we can find it)
        // This ensures both users see the updated member list
        const allStorageKeys = Object.keys(localStorage);
        const groupKeys = allStorageKeys.filter(key => key.startsWith('nudgeup_groups_'));
        
        for (const key of groupKeys) {
          try {
            const storedGroups = localStorage.getItem(key);
            if (storedGroups) {
              const parsedGroups = JSON.parse(storedGroups);
              if (Array.isArray(parsedGroups)) {
                const groupIndex = parsedGroups.findIndex((g: any) => g.id === group.id);
                if (groupIndex !== -1) {
                  // Update the group in the original user's storage
                  // Check if member already exists to avoid duplicates
                  const existingMemberList = parsedGroups[groupIndex].memberList || [];
                  const memberExists = existingMemberList.some((m: any) => m.id === currentUserId);
                  
                  if (!memberExists) {
                    parsedGroups[groupIndex] = {
                      ...parsedGroups[groupIndex],
                      memberList: [...existingMemberList, currentUser],
                      members: existingMemberList.length + 1,
                    };
                  } else {
                    // Update member count to match actual member list length (remove duplicates)
                    const uniqueMembers = existingMemberList.filter((m: any, index: number, self: any[]) => 
                      index === self.findIndex((mem: any) => mem.id === m.id)
                    );
                    parsedGroups[groupIndex] = {
                      ...parsedGroups[groupIndex],
                      memberList: uniqueMembers,
                      members: uniqueMembers.length,
                    };
                  }
                  localStorage.setItem(key, JSON.stringify(parsedGroups));
                  break;
                }
              }
            }
          } catch (e) {
            console.warn('Error updating group in', key, e);
          }
        }
      } else {
        // Add user to existing group
        addMemberToGroup(group.id, currentUser);
      }
      
      // Find and add all commitments shared with this group
      // Search all users' localStorage for commitments with this group ID
      const allStorageKeys = Object.keys(localStorage);
      const commitmentKeys = allStorageKeys.filter(key => key.startsWith('nudgeup_commitments_'));
      const foundCommitments: Commitment[] = [];
      
      console.log('🔍 Searching for commitments with group ID:', group.id);
      console.log('📦 Found commitment storage keys:', commitmentKeys);
      
      for (const key of commitmentKeys) {
        try {
          const storedCommitments = localStorage.getItem(key);
          if (storedCommitments) {
            const parsedCommitments = JSON.parse(storedCommitments);
            if (Array.isArray(parsedCommitments)) {
              console.log(`📋 Checking ${key}:`, parsedCommitments.length, 'commitments');
              // Find commitments that have this group ID in their groupIds array
              const groupCommitments = parsedCommitments.filter((c: Commitment) => {
                const hasGroupId = c.groupIds && c.groupIds.includes(group.id);
                if (hasGroupId) {
                  console.log('✅ Found commitment shared with group:', c.name, c.groupIds);
                }
                return hasGroupId;
              });
              foundCommitments.push(...groupCommitments);
            }
          }
        } catch (e) {
          console.warn('Error reading commitments from', key, e);
        }
      }
      
      console.log('🎯 Total commitments found for group:', foundCommitments.length);
      console.log('📝 Commitments:', foundCommitments.map(c => c.name));
      
      // Add each found commitment to the current user's commitments
      // Get fresh user commitments from localStorage to avoid stale state
      const userId = user?.id || 'anonymous';
      const userCommitmentsKey = `nudgeup_commitments_${userId}`;
      const storedUserCommitments = localStorage.getItem(userCommitmentsKey);
      const currentUserCommitments: Commitment[] = storedUserCommitments 
        ? JSON.parse(storedUserCommitments) 
        : [];
      
      console.log('👤 Current user commitments:', currentUserCommitments.length);
      console.log('📋 Current user commitment names:', currentUserCommitments.map(c => c.name));
      
      // Only add if the user doesn't already have a commitment with the same name for this group
      for (const commitment of foundCommitments) {
        const alreadyExists = currentUserCommitments.some(c => 
          c.name === commitment.name && c.groupIds?.includes(group.id)
        );
        
        console.log(`🔎 Checking if "${commitment.name}" already exists:`, alreadyExists);
        
        if (!alreadyExists) {
          console.log(`➕ Adding commitment "${commitment.name}" to user's list`);
          // Create a new commitment for the user with the group ID included
          addCommitment({
            name: commitment.name,
            icon: commitment.icon,
            groupIds: [group.id, ...(commitment.groupIds || [])], // Include the group ID
            frequencyType: commitment.frequencyType || 'daily',
            timesPerWeek: commitment.timesPerWeek,
            duration: commitment.duration,
          });
        } else {
          console.log(`⏭️ Skipping "${commitment.name}" - already exists`);
        }
      }
      
      console.log('✅ Finished adding commitments');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onJoin(inviteCode);
      setCodeOrLink('');
      setError('');
      onClose();
      alert(`Successfully joined ${group.name}! 🎉`);
    } catch (error) {
      console.error('Error joining group:', error);
      setError('Failed to join group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-white rounded-3xl p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-neutral-700 text-xl font-medium leading-8" style={{ fontFamily: 'Inter, sans-serif' }}>
            Join a Group
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 5L5 15M5 5L15 15" stroke="#4A5568" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-neutral-700 text-base font-normal leading-6 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
              Enter group code or link
            </label>
            <Input
              type="text"
              placeholder="e.g., ABC123 or https://nudgeup.app/join/ABC123"
              value={codeOrLink}
              onChange={(e) => {
                setCodeOrLink(e.target.value);
                setError('');
              }}
              className="w-full"
            />
            {error && (
              <p className="text-red-500 text-sm mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                {error}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isLoading || !codeOrLink.trim()}
            >
              {isLoading ? 'Joining...' : 'Join Group'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

