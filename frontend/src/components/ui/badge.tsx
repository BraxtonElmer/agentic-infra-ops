import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'muted';
  className?: string;
}

const variantMap = {
  blue:   'bg-accent-blue-bg text-accent-blue border border-accent-blue/20',
  green:  'bg-accent-green-bg text-accent-green border border-accent-green/20',
  amber:  'bg-accent-amber-bg text-accent-amber border border-accent-amber/20',
  red:    'bg-accent-red-bg text-accent-red border border-accent-red/20',
  purple: 'bg-accent-purple-bg text-accent-purple border border-accent-purple/20',
  muted:  'bg-bg-overlay text-text-secondary border border-border-default',
};

export function Badge({ children, variant = 'muted', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-mono text-[10px] leading-none px-[6px] py-[2px] rounded-[3px] font-medium ${variantMap[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
