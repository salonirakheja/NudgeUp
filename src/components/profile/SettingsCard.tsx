'use client';

interface SettingsCardProps {
  icon: string;
  title: string;
  subtitle: string;
  onClick?: () => void;
  customIcon?: React.ReactNode;
}

export const SettingsCard = ({ icon, title, subtitle, onClick, customIcon }: SettingsCardProps) => {
  return (
    <button
      onClick={onClick}
      className="w-full h-20 bg-white rounded-2xl shadow-md border-2 border-neutral-50 px-5 py-4 flex items-center gap-3 hover:shadow-lg transition-shadow"
    >
      {/* Icon - Smaller and thinner */}
      <div className="w-10 h-10 bg-neutral-50 rounded-full flex justify-center items-center flex-shrink-0">
        {customIcon ? (
          <div style={{ width: '20px', height: '20px' }}>
            {customIcon}
          </div>
        ) : (
          <img 
            src={icon} 
            alt={title} 
            className="w-5 h-5"
            style={{ filter: 'opacity(0.9)' }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-start gap-1 min-w-0 text-left">
        <span className="text-neutral-700 text-[16px] font-normal leading-[24px] text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
          {title}
        </span>
        <span className="text-neutral-500 text-[13px] font-medium leading-[18px] truncate w-full text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
          {subtitle}
        </span>
      </div>

      {/* Chevron - Small right chevron */}
      <div className="flex-shrink-0">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 4L10 8L6 12" stroke="#A0AEC0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </button>
  );
};

