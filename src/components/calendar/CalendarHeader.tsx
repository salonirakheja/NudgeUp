'use client';

export const CalendarHeader = () => {
  return (
    <div className="w-full flex flex-col gap-2 items-center pt-12">
      <h1 className="text-black text-[23px] font-bold leading-[32px]" style={{ fontFamily: 'Inter, sans-serif' }}>
        Calendar
      </h1>
      <p className="text-neutral-500 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
        Your consistency journey 📅
      </p>
    </div>
  );
};

