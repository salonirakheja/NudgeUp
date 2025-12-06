'use client';

import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { SettingsCard } from './SettingsCard';

export const AccountSettingsSection = () => {
  const router = useRouter();
  const { signOut, user } = useAuthContext();

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleEmailSettings = () => {
    router.push('/profile/email');
  };

  const handlePasswordSecurity = () => {
    router.push('/profile/security');
  };

  const handleNotifications = () => {
    router.push('/profile/notifications');
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      signOut();
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <h3 className="text-neutral-700 text-base font-normal leading-6 px-0" style={{ fontFamily: 'Inter, sans-serif' }}>
        Account
      </h3>

      <div className="flex flex-col gap-3" style={{ gap: '12px' }}>
        <SettingsCard
          icon="/icons/Profile/Icon-4.svg"
          title="Edit Profile"
          subtitle="Change your name or avatar"
          onClick={handleEditProfile}
        />
        <SettingsCard
          icon="/icons/Profile/Icon-5.svg"
          title="Email Settings"
          subtitle={user?.email || 'Not signed in'}
          onClick={handleEmailSettings}
        />
        <SettingsCard
          icon="/icons/Profile/Icon-6.svg"
          title="Password & Security"
          subtitle="Update your password"
          onClick={handlePasswordSecurity}
        />
        <SettingsCard
          icon="/icons/Profile/Icon-7.svg"
          title="Notifications"
          subtitle="Manage reminders and alerts"
          onClick={handleNotifications}
          customIcon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 6.66667C15 5.34058 14.4732 4.06881 13.5355 3.13115C12.5979 2.19349 11.3261 1.66667 10 1.66667C8.67392 1.66667 7.40215 2.19349 6.46447 3.13115C5.52678 4.06881 5 5.34058 5 6.66667C5 12.5 2.5 14.1667 2.5 14.1667H17.5C17.5 14.1667 15 12.5 15 6.66667Z" stroke="#718096" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11.4417 17.5C11.2952 17.7526 11.0851 17.9622 10.8321 18.1089C10.5791 18.2555 10.2922 18.3339 10 18.3339C9.70777 18.3339 9.42088 18.2555 9.16789 18.1089C8.9149 17.9622 8.70476 17.7526 8.55833 17.5" stroke="#718096" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />
      </div>

      {/* Divider */}
      <div className="pt-4">
        <div className="h-px bg-neutral-200"></div>
      </div>

      {/* Log Out Button */}
      <div className="pt-3">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2.5 rounded-full transition-colors text-left flex items-center gap-2"
          style={{
            backgroundColor: '#FDECEC',
            border: '1px solid rgba(220, 38, 38, 0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FCE7E7';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FDECEC';
          }}
        >
          <span className="text-base">🔓</span>
          <span className="text-red-600 text-[14px] font-medium leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Log Out
          </span>
        </button>
      </div>
    </div>
  );
};

