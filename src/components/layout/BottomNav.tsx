'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const BottomNav = () => {
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full max-w-[440px] mx-auto h-14 bg-white border-t border-neutral-200 flex items-center justify-around z-50">
      {/* Home */}
      <Link href="/check-in" className="flex flex-col items-center gap-1">
        <div className="w-5 h-5">
          <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M10 2L3 7V17C3 17.5523 3.44772 18 4 18H7V12C7 11.4477 7.44772 11 8 11H12C12.5523 11 13 11.4477 13 12V18H16C16.5523 18 17 17.5523 17 17V7L10 2Z" 
              fill={isActive('/check-in') ? '#BCC225' : 'none'}
              stroke={isActive('/check-in') ? '#BCC225' : '#4A5568'}
              strokeWidth={isActive('/check-in') ? '0' : '1.5'}
            />
          </svg>
        </div>
        <span className={`text-[12px] font-medium leading-[16px] ${isActive('/check-in') ? 'text-primary-400' : 'text-neutral-500'}`} style={{ fontFamily: 'Inter, sans-serif' }}>Home</span>
      </Link>

      {/* Groups */}
      <Link href="/groups" className="flex flex-col items-center gap-1">
        <div className="w-5 h-5">
          <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M10 9C11.6569 9 13 7.65685 13 6C13 4.34315 11.6569 3 10 3C8.34315 3 7 4.34315 7 6C7 7.65685 8.34315 9 10 9Z" 
              fill={isActive('/groups') ? '#BCC225' : 'none'}
              stroke={isActive('/groups') ? '#BCC225' : '#4A5568'} 
              strokeWidth="1.5"
            />
            <path 
              d="M3 18C3 14.6863 5.68629 12 9 12H11C14.3137 12 17 14.6863 17 18" 
              fill={isActive('/groups') ? '#BCC225' : 'none'}
              stroke={isActive('/groups') ? '#BCC225' : '#4A5568'} 
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span className={`text-[12px] font-medium leading-[16px] ${isActive('/groups') ? 'text-primary-400' : 'text-neutral-500'}`} style={{ fontFamily: 'Inter, sans-serif' }}>Groups</span>
      </Link>

      {/* Calendar */}
      <Link href="/calendar" className="flex flex-col items-center gap-1">
        <div className="w-5 h-5">
          <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M6 2V4M14 2V4M3 6H17M4 4H16C16.5523 4 17 4.44772 17 5V17C17 17.5523 16.5523 18 16 18H4C3.44772 18 3 17.5523 3 17V5C3 4.44772 3.44772 4 4 4Z" 
              stroke={isActive('/calendar') ? '#BCC225' : '#4A5568'} 
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span className={`text-[12px] font-medium leading-[16px] ${isActive('/calendar') ? 'text-primary-400' : 'text-neutral-500'}`} style={{ fontFamily: 'Inter, sans-serif' }}>Calendar</span>
      </Link>

      {/* Profile */}
      <Link href="/profile" className="flex flex-col items-center gap-1">
        <div className="w-5 h-5 flex justify-center items-center">
          {isActive('/profile') ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 21V19C19 17.9391 18.5786 16.9217 17.8284 16.1716C17.0783 15.4214 16.0609 15 15 15H9C7.93913 15 6.92172 15.4214 6.17157 16.1716C5.42143 16.9217 5 17.9391 5 19V21" stroke="#BDC225" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#BDC225" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <img 
              src="/icons/Profile/Icon-3.svg" 
              alt="Profile" 
              className="w-5 h-5"
              style={{
                filter: 'brightness(0) saturate(100%) invert(45%) sepia(8%) saturate(1000%) hue-rotate(180deg) brightness(95%) contrast(85%)',
              }}
            />
          )}
        </div>
        <span className={`text-[12px] font-medium leading-[16px] ${isActive('/profile') ? 'text-primary-400' : 'text-neutral-500'}`} style={{ fontFamily: 'Inter, sans-serif' }}>Profile</span>
      </Link>
    </nav>
  );
};

