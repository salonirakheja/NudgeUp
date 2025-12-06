import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({
  className = '',
  ...props
}) => {
  return (
    <input
      className={`w-full rounded-[16px] outline outline-1 outline-offset-[-1px] outline-neutral-200 bg-white px-4 py-2 text-[16px] font-normal leading-[24px] text-black placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${className}`}
      {...props}
    />
  );
};

