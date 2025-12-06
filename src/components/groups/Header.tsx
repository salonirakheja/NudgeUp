'use client';

interface HeaderProps {
  onCreateClick: () => void;
}

export const Header = ({ onCreateClick }: HeaderProps) => {
  return (
    <div className="w-full px-6 pt-12 pb-4">
      {/* Groups Title with Create Button - iOS Navigation Bar Style */}
      <div className="flex justify-between items-center mb-1 relative">
        <h1 className="text-black text-[23px] font-bold leading-[32px] absolute left-1/2 transform -translate-x-1/2" style={{ fontFamily: 'Inter, sans-serif' }}>
          Groups
        </h1>
        <div className="flex-1"></div>
        <button
          onClick={onCreateClick}
          className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center hover:bg-neutral-200 transition-colors relative z-10"
        >
          <span className="text-neutral-700 text-[18px] font-medium leading-none">+</span>
        </button>
      </div>

      {/* Subtitle - Center Aligned - Reduced spacing */}
      <div className="text-center">
        <p className="text-neutral-500 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          Your shared commitments, all in one place.
        </p>
      </div>
    </div>
  );
};

