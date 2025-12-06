'use client';

export const SendEncouragementButton = () => {
  const handleSend = () => {
    // TODO: Implement send encouragement functionality
    alert('Send encouragement feature coming soon!');
  };

  return (
    <button
      onClick={handleSend}
      className="w-full h-14 bg-primary-500 rounded-2xl shadow-lg text-white text-[16px] font-normal leading-[24px] hover:opacity-90 transition-opacity"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      Send Encouragement
    </button>
  );
};

