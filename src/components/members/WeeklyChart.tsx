'use client';

interface WeeklyData {
  day: string;
  completed: number;
  total: number;
  isToday?: boolean;
}

interface WeeklyChartProps {
  weeklyData: WeeklyData[];
}

export const WeeklyChart = ({ weeklyData }: WeeklyChartProps) => {
  const maxHeight = 112; // h-28 in pixels (7rem = 112px)

  return (
    <div className="w-full flex flex-col gap-4">
      <h3 className="text-neutral-700 text-[18px] font-semibold leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
        This Week
      </h3>

      <div className="w-full bg-white rounded-2xl shadow-md p-5 border-2 border-neutral-50">
        <div className="flex justify-between items-end gap-2 h-40">
          {weeklyData.map((data, index) => {
            const heightPercent = (data.completed / data.total) * 100;
            const barHeight = (heightPercent / 100) * maxHeight;

            return (
              <div key={index} className="flex-1 flex flex-col justify-end items-center gap-2">
                {/* Bar with label */}
                <div className="w-11 flex-1 flex flex-col justify-end items-center gap-1">
                  {/* Completed label */}
                  <div className="w-5 h-4 flex items-center justify-center">
                    <span className="text-neutral-500 text-xs font-normal leading-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {data.completed}/{data.total}
                    </span>
                  </div>
                  
                  {/* Bar */}
                  <div 
                    className={`w-11 rounded-[10px] transition-all ${
                      data.isToday 
                        ? 'bg-primary-400' 
                        : 'bg-success-100'
                    }`}
                    style={{ height: `${barHeight}px` }}
                  />
                </div>

                {/* Day label */}
                <div className="h-6 flex items-center">
                  <span 
                    className={`text-neutral-500 text-base leading-6 ${
                      data.isToday ? 'font-medium' : 'font-normal'
                    }`}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {data.day}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

