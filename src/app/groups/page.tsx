'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Header } from '@/components/groups/Header';
import { GroupCard } from '@/components/groups/GroupCard';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';
import { JoinGroupModal } from '@/components/groups/JoinGroupModal';
import { BottomNav } from '@/components/layout/BottomNav';
import { useGroups } from '@/contexts/GroupsContext';
import { useRouter } from 'next/navigation';

function GroupsPageContent() {
  const { groups, createGroup } = useGroups();
  const router = useRouter();
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const handlePlusClick = () => {
    setIsChoiceModalOpen(true);
  };

  const handleCreateClick = () => {
    setIsChoiceModalOpen(false);
    setIsCreateModalOpen(true);
  };

  const handleJoinClick = () => {
    setIsChoiceModalOpen(false);
    setIsJoinModalOpen(true);
  };

  const handleCreateGroup = (groupData: { name: string; icon: string; description?: string; challengeDuration?: number }) => {
    const newGroup = createGroup({
      name: groupData.name,
      icon: groupData.icon,
      description: groupData.description,
      totalDays: groupData.challengeDuration,
    });
    // Navigate to the new group's detail page
    router.push(`/groups/${newGroup.id}`);
  };

  const handleJoinGroup = (codeOrLink: string) => {
    // Group is already joined in JoinGroupModal, just refresh the page
    router.refresh();
  };

  return (
    <div className="w-full max-w-[440px] min-h-[956px] relative bg-white mx-auto pb-20">
      {/* Header */}
      <div className="pt-0">
        <Header onCreateClick={handlePlusClick} />
      </div>

      {/* Active Commitments Section */}
      <div className="px-6 pt-6">
        <h2 className="text-neutral-700 text-xl font-medium leading-8" style={{ fontFamily: 'Inter, sans-serif' }}>
          Active Commitments
        </h2>
      </div>

      {/* Groups List */}
      <div className="px-6 pt-4 flex flex-col gap-3">
        {groups.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>

      {/* Choice Modal - Create or Join */}
      {isChoiceModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="w-full max-w-[440px] bg-white rounded-t-3xl p-6 pb-8">
            <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mb-6"></div>
            <h2 className="text-neutral-700 text-xl font-medium leading-8 mb-6 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
              Add Group
            </h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleCreateClick}
                className="w-full px-4 py-4 bg-primary-100 text-primary-700 rounded-2xl font-medium hover:bg-primary-200 transition-colors text-left flex items-center gap-3"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">+</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-semibold">Create New Group</span>
                  <span className="text-sm text-primary-600">Start your own challenge</span>
                </div>
              </button>
              <button
                onClick={handleJoinClick}
                className="w-full px-4 py-4 bg-neutral-50 text-neutral-700 rounded-2xl font-medium hover:bg-neutral-100 transition-colors text-left flex items-center gap-3"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 3L5 8L10 13M15 3L10 8L15 13" stroke="#4A5568" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-semibold">Join with Code</span>
                  <span className="text-sm text-neutral-600">Enter a group invite code</span>
                </div>
              </button>
            </div>
            <button
              onClick={() => setIsChoiceModalOpen(false)}
              className="w-full mt-4 px-4 py-3 bg-neutral-100 text-neutral-700 rounded-2xl font-medium hover:bg-neutral-200 transition-colors"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateGroup}
      />

      {/* Join Group Modal */}
      <JoinGroupModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoin={handleJoinGroup}
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

export default function GroupsPage() {
  return (
    <ProtectedRoute>
      <GroupsPageContent />
    </ProtectedRoute>
  );
}

