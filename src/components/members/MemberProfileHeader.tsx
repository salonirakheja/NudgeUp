'use client';

interface Member {
  id: string;
  name: string;
  avatar: string;
  memberSince: string;
}

interface MemberProfileHeaderProps {
  member: Member;
  onBack: () => void;
}

export const MemberProfileHeader = ({ member, onBack }: MemberProfileHeaderProps) => {
  return (
    <div className="w-full px-6 pt-12 pb-4">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="w-10 h-10 bg-neutral-50 rounded-full inline-flex justify-center items-center mb-4"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.5 5L7.5 10L12.5 15" stroke="#4A5568" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Member Info */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-20 h-20 bg-primary-100 rounded-full shadow-lg flex justify-center items-center">
          <span className="text-neutral-950 text-4xl font-normal leading-10 tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
            {member.avatar}
          </span>
        </div>

        {/* Name and Member Since */}
        <div className="flex-1 flex flex-col gap-1">
          <h1 className="text-neutral-700 text-[24px] font-bold leading-[32px] tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
            {member.name}
          </h1>
          <p className="text-neutral-500 text-[14px] font-normal leading-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Member since {member.memberSince}
          </p>
        </div>
      </div>
    </div>
  );
};

