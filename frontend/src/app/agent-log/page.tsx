'use client';

import { useState } from 'react';
import { Topbar } from '@/components/shell/topbar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusDot } from '@/components/ui/status-dot';
import { Skeleton } from '@/components/ui/skeleton';
import { useFetch } from '@/lib/use-fetch';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'scan' | 'fix' | 'diagnose' | 'recommend' | 'flag';
  target: string;
  message: string;
  reasoning: string;
}

interface AgentLogData {
  entries: LogEntry[];
}

const typeBadge: Record<string, 'blue' | 'green' | 'purple' | 'amber' | 'red'> = {
  scan: 'blue',
  fix: 'green',
  diagnose: 'purple',
  recommend: 'amber',
  flag: 'red',
};

const typeToCategory: Record<string, string> = {
  scan: 'pipeline',
  fix: 'pipeline',
  diagnose: 'infra',
  recommend: 'cost',
  flag: 'infra',
};

export default function AgentLogPage() {
  const { data, isLoading } = useFetch<AgentLogData>('/api/agent-log');
  const [filter, setFilter] = useState('all');
  const [live, setLive] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading || !data) {
    return (
      <>
        <Topbar title="Agent Log" />
        <div className="p-4 sm:p-5 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16" />)}
        </div>
      </>
    );
  }

  const filtered = filter === 'all'
    ? data.entries
    : data.entries.filter((e) => typeToCategory[e.type] === filter);

  return (
    <>
      <Topbar
        title="Agent Log"
        primaryAction={undefined}
      />
      <div className="p-4 sm:p-5 space-y-4">
        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            {['all', 'pipeline', 'infra', 'cost'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`h-7 px-2.5 rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer ${
                  filter === f ? 'bg-bg-elevated text-text-primary' : 'text-text-secondary hover:bg-bg-elevated'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {live && <StatusDot status="healthy" pulse size={6} />}
            <button
              onClick={() => setLive(!live)}
              className={`h-7 px-2.5 rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer ${
                live ? 'bg-bg-elevated text-text-primary' : 'bg-bg-elevated text-text-muted'
              }`}
            >
              {live ? 'Live' : 'Paused'}
            </button>
          </div>
        </div>

        {/* Log entries */}
        <div className="space-y-1.5">
          {filtered.map((entry) => {
            const expanded = expandedId === entry.id;
            return (
              <Card key={entry.id} className="overflow-hidden">
                <button
                  className="w-full flex flex-col sm:flex-row items-start gap-2 sm:gap-3 p-3 text-left cursor-pointer hover:bg-bg-elevated/50 transition-colors"
                  onClick={() => setExpandedId(expanded ? null : entry.id)}
                >
                  <div className="flex items-center gap-2 sm:contents w-full">
                    <span className="text-[10px] font-mono text-text-muted shrink-0 sm:w-16">{entry.timestamp}</span>
                    <Badge variant="muted">{entry.type}</Badge>
                    <span className="text-[11px] font-mono text-text-secondary shrink-0 hidden sm:inline">{entry.target}</span>
                    <span className="ml-auto sm:hidden">
                      {expanded
                        ? <ChevronDown className="w-4 h-4 text-text-muted" />
                        : <ChevronRight className="w-4 h-4 text-text-muted" />}
                    </span>
                  </div>
                  <p className="text-[12px] text-text-secondary flex-1 leading-relaxed">{entry.message}</p>
                  {expanded
                    ? <ChevronDown className="w-4 h-4 text-text-muted shrink-0 mt-0.5 hidden sm:block" />
                    : <ChevronRight className="w-4 h-4 text-text-muted shrink-0 mt-0.5 hidden sm:block" />}
                </button>
                {expanded && (
                  <div className="mx-3 mb-3 p-3 bg-bg-elevated rounded-[6px]">
                    <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1.5">Reasoning</div>
                    <p className="text-[12px] font-mono text-text-secondary leading-relaxed">{entry.reasoning}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
