import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'muted';
  className?: string;
}

const variantMap = {
  blue:   'bg-bg-overlay text-text-secondary border border-border-subtle',
  green:  'bg-accent-green-bg text-accent-green border border-accent-green/15',
  amber:  'bg-accent-amber-bg text-accent-amber border border-accent-amber/15',
  red:    'bg-accent-red-bg text-accent-red border border-accent-red/15',
  purple: 'bg-bg-overlay text-text-secondary border border-border-subtle',
  muted:  'bg-bg-overlay text-text-muted border border-border-subtle',
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
