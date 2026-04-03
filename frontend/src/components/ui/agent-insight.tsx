import { ReactNode } from 'react';

interface AgentInsightProps {
  label: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function AgentInsight({ label, description, actionText, onAction }: AgentInsightProps) {
  return (
    <div className="bg-accent-blue-bg border border-accent-blue/18 rounded-[6px] p-3">
      <span className="font-mono text-[10px] text-accent-purple font-medium">{label}</span>
      <p className="text-[12px] text-text-secondary mt-1 leading-relaxed">{description}</p>
      {actionText && (
        <button onClick={onAction} className="text-[11px] text-accent-blue mt-1.5 hover:underline cursor-pointer">
          {actionText}
        </button>
      )}
    </div>
  );
}
