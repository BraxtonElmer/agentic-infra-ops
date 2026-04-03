interface MetricBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
}

function getBarColor(pct: number) {
  if (pct >= 90) return 'bg-accent-red';
  if (pct >= 70) return 'bg-accent-amber';
  return 'bg-accent-green';
}

export function MetricBar({ value, max = 100, label, showValue = true }: MetricBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2 w-full">
      {label && <span className="text-[11px] text-text-muted font-mono w-8 shrink-0">{label}</span>}
      <div className="flex-1 h-[4px] bg-bg-overlay rounded-[2px] overflow-hidden">
        <div className={`h-full rounded-[2px] ${getBarColor(pct)}`} style={{ width: `${pct}%` }} />
      </div>
      {showValue && <span className="text-[11px] text-text-secondary font-mono w-8 text-right shrink-0">{Math.round(pct)}%</span>}
    </div>
  );
}
