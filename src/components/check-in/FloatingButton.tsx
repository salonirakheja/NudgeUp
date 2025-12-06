'use client';

interface FloatingButtonProps {
  onClick: () => void;
}

export const FloatingButton = ({ onClick }: FloatingButtonProps) => {
  return (
    <div className="fixed bottom-[100px] right-0 left-0 flex justify-end pr-4 max-w-[440px] mx-auto z-20">
      <button 
        onClick={onClick}
        className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-90 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.2)]"
        style={{ backgroundColor: '#A6B41F' }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 3.5V14.5M3.5 9H14.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
};

