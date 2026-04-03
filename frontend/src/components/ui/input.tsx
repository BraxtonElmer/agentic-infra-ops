import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className = '', ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`h-9 w-full bg-bg-elevated border border-border-default rounded-[6px] px-3 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-strong transition-colors ${className}`}
      {...props}
    />
  );
});

Input.displayName = 'Input';
