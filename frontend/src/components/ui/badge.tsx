import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'muted';
  className?: string;
}

const variantMap = {
  blue: 'bg-accent-blue-bg text-accent-blue',
  green: 'bg-accent-green-bg text-accent-green',
  amber: 'bg-accent-amber-bg text-accent-amber',
  red: 'bg-accent-red-bg text-accent-red',
  purple: 'bg-accent-purple-bg text-accent-purple',
  muted: 'bg-bg-overlay text-text-muted',
};

export function Badge({ children, variant = 'muted', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-mono text-[10px] leading-none px-[7px] py-[2px] rounded-[4px] font-medium ${variantMap[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
