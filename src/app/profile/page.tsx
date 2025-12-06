'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { AccountSettingsSection } from '@/components/profile/AccountSettingsSection';
import { NotificationsCard } from '@/components/profile/NotificationsCard';
import { BottomNav } from '@/components/layout/BottomNav';

function ProfilePageContent() {
  return (
    <div className="w-full max-w-[440px] min-h-[956px] relative bg-white mx-auto pb-20">
      {/* Header */}
      <div className="pt-0">
        <ProfileHeader />
      </div>

      {/* Profile Card */}
      <div className="px-6 pt-4">
        <ProfileCard />
      </div>

      {/* Divider */}
      <div className="px-6 pt-3">
        <div className="h-px bg-neutral-200"></div>
      </div>

      {/* Account Settings */}
      <div className="px-6 pt-4">
        <AccountSettingsSection />
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}

