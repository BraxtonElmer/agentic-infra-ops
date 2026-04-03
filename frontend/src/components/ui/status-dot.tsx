'use client';

interface StatusDotProps {
  status: 'pass' | 'fail' | 'running' | 'idle' | 'warning' | 'critical' | 'healthy';
  pulse?: boolean;
  size?: number;
}

const colorMap: Record<string, string> = {
  pass: 'bg-accent-green',
  healthy: 'bg-accent-green',
  idle: 'bg-accent-green',
  fail: 'bg-accent-red',
  critical: 'bg-accent-red',
  running: 'bg-accent-blue',
  warning: 'bg-accent-amber',
};

export function StatusDot({ status, pulse, size = 6 }: StatusDotProps) {
  return (
    <span
      className={`inline-block rounded-full shrink-0 ${colorMap[status] || 'bg-text-muted'} ${pulse ? 'pulse-dot' : ''}`}
      style={{ width: size, height: size }}
    />
  );
}
