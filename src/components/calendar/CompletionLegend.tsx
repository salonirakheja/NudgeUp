'use client';

interface LegendItem {
  label: string;
  bgColor: string;
  border?: string;
}

export const CompletionLegend = () => {
  const legendItems: LegendItem[] = [
    { label: '0%', bgColor: 'bg-neutral-50', border: 'border-2 border-neutral-200' },
    { label: '25%', bgColor: 'bg-success-100', border: '' },
    { label: '50%', bgColor: 'bg-primary-200' },
    { label: '75%', bgColor: 'bg-primary-300' },
    { label: '100%', bgColor: 'bg-primary-500' },
  ];

  return (
    <div className="w-full bg-neutral-50 rounded-2xl p-5 flex flex-col gap-2">
      <h3 className="text-neutral-700 text-[18px] font-semibold leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
        Daily Completion
      </h3>
      <p className="text-neutral-500 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
        Shows % of commitments completed each day
      </p>
      <div className="flex items-center justify-between mt-4">
        {legendItems.map((item, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-2xl ${item.bgColor} ${item.border || ''}`} />
            <span className="text-neutral-500 text-[13px] font-medium leading-[18px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

