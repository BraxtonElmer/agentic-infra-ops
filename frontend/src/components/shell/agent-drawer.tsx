'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { Badge } from '@/components/ui/badge';
import { useFetch } from '@/lib/use-fetch';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'scan' | 'fix' | 'diagnose' | 'recommend' | 'flag';
  target: string;
  message: string;
}

const typeBadgeVariant: Record<string, 'blue' | 'green' | 'amber' | 'red' | 'purple'> = {
  scan: 'blue',
  fix: 'green',
  diagnose: 'purple',
  recommend: 'amber',
  flag: 'red',
};

export function AgentDrawer() {
  const open = useAppStore((s) => s.agentDrawerOpen);
  const close = useAppStore((s) => s.closeAgentDrawer);
  const { data } = useFetch<{ entries: LogEntry[] }>('/api/agent-log');

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) close();
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        useAppStore.getState().toggleAgentDrawer();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, close]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={close} />
      )}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-bg-surface border-l border-border-subtle z-50 flex flex-col transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-[52px] flex items-center justify-between px-4 border-b border-border-subtle shrink-0">
          <span className="text-[13px] font-medium text-text-primary">Agent Log</span>
          <button
            onClick={close}
            className="w-7 h-7 flex items-center justify-center rounded-[6px] text-text-secondary hover:bg-bg-elevated cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {data?.entries?.map((entry) => (
            <div key={entry.id} className="p-2.5 rounded-[6px] bg-bg-elevated border border-border-subtle">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-text-muted">{entry.timestamp}</span>
                <Badge variant="muted">{entry.type}</Badge>
                <span className="text-[11px] font-mono text-text-secondary">{entry.target}</span>
              </div>
              <p className="text-[12px] text-text-secondary leading-relaxed">{entry.message}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
