import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-bg-surface border border-border-subtle rounded-[6px] ${className}`}>
      {children}
    </div>
  );
}
