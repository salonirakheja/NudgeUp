import React from 'react';
import Image from 'next/image';

export const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-0 relative">
      <span className="text-black text-2xl font-extrabold leading-9 italic" style={{ fontFamily: 'Inter, sans-serif' }}>Nudge</span>
      <span className="text-2xl font-extrabold leading-9 italic" style={{ fontFamily: 'Inter, sans-serif', color: '#A6B41F' }}>U</span>
      <span className="text-black text-2xl font-extrabold leading-9 italic" style={{ fontFamily: 'Inter, sans-serif' }}>p</span>
      {/* Logo graphic - positioned so green part aligns with green "U" */}
      <div className="flex items-center" style={{ marginLeft: '-52px', marginTop: '12px' }}>
        <div className="relative" style={{ width: '105px', height: '69.38px' }}>
          <Image
            src="/images/Logo.png"
            alt="NudgeUp logo graphic"
            width={105}
            height={69.38}
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
};

