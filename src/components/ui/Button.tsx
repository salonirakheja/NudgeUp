import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

function Button({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'w-full rounded-[16px] text-[16px] font-normal leading-[24px] px-4 py-4 transition-colors inline-flex justify-center items-center';
  
  const variantClasses = {
    primary: 'bg-[#A6B41F] text-neutral-950 hover:opacity-90',
    secondary: 'bg-white border border-neutral-200 text-neutral-950 hover:bg-neutral-50',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {children}
    </button>
  );
}

export { Button };

