export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-bg-overlay rounded-[6px] ${className}`} />
  );
}
