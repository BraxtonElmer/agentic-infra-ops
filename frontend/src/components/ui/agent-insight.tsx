import { ReactNode } from 'react';

interface AgentInsightProps {
  label: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function AgentInsight({ label, description, actionText, onAction }: AgentInsightProps) {
  return (
    <div className="bg-bg-elevated border border-border-subtle rounded-[6px] p-3">
      <span className="font-mono text-[10px] text-text-muted font-medium uppercase tracking-wide">{label}</span>
      <p className="text-[12px] text-text-secondary mt-1 leading-relaxed">{description}</p>
      {actionText && (
        <button onClick={onAction} className="text-[11px] text-text-secondary mt-1.5 hover:text-text-primary transition-colors cursor-pointer">
          {actionText} →
        </button>
      )}
    </div>
  );
}
