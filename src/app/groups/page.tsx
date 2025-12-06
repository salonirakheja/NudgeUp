'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Header } from '@/components/groups/Header';
import { GroupCard } from '@/components/groups/GroupCard';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';
import { BottomNav } from '@/components/layout/BottomNav';
import { useGroups } from '@/contexts/GroupsContext';
import { useRouter } from 'next/navigation';

function GroupsPageContent() {
  const { groups, createGroup } = useGroups();
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

  return (
    <div className="w-full max-w-[440px] min-h-[956px] relative bg-white mx-auto pb-20">
      {/* Header */}
      <div className="pt-0">
        <Header onCreateClick={() => setIsCreateModalOpen(true)} />
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

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateGroup}
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

