'use client';

interface Achievement {
  id: string;
  name: string;
}

interface AchievementsSectionProps {
  achievements: Achievement[];
}

export const AchievementsSection = ({ achievements }: AchievementsSectionProps) => {
  return (
    <div className="w-full flex flex-col gap-4">
      <h3 className="text-neutral-700 text-[18px] font-semibold leading-[24px]" style={{ fontFamily: 'Inter, sans-serif' }}>
        Achievements
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {achievements.map((achievement) => (
          <div 
            key={achievement.id}
            className="bg-white rounded-2xl shadow-md p-4 border border-neutral-100"
          >
            <div className="mb-2">
              <img 
                src="/icons/Member profile/Icon.svg" 
                alt={achievement.name} 
                className="w-6 h-6"
              />
            </div>
            <div className="text-yellow-700 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              {achievement.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

