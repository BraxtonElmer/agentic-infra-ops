'use client';

import { useState } from 'react';
import { Topbar } from '@/components/shell/topbar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFetch } from '@/lib/use-fetch';

interface ActiveAlert {
  id: string; severity: string; title: string; resource: string; timestamp: string;
  assessment: string; recommendation: string;
}

interface HistoryAlert {
  id: string; title: string; severity: string; resolvedAt: string; resolvedBy: string; action: string;
}

interface AlertsData {
  active: ActiveAlert[];
  history: HistoryAlert[];
}

const severityBadge: Record<string, 'red' | 'amber' | 'blue'> = {
  critical: 'red', warning: 'amber', info: 'blue',
};

const severityBg: Record<string, string> = {
  critical: 'border-l-2 border-l-accent-red/60',
  warning: 'border-l-2 border-l-accent-amber/60',
  info: 'border-l-2 border-l-border-strong',
};

export default function AlertsPage() {
  const { data, isLoading } = useFetch<AlertsData>('/api/alerts');
  const [tab, setTab] = useState<'active' | 'history'>('active');

  if (isLoading || !data) {
    return (
      <>
        <Topbar title="Alerts" />
        <div className="p-4 sm:p-5 space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Alerts" />
      <div className="p-4 sm:p-5 space-y-4">
        {/* Tabs */}
        <div className="flex items-center gap-1">
          {(['active', 'history'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`h-8 px-3 rounded-[6px] text-[13px] font-medium transition-colors cursor-pointer ${
                tab === t ? 'bg-bg-elevated text-text-primary' : 'text-text-secondary hover:bg-bg-elevated'
              }`}
            >
              {t === 'active' ? `Active (${data.active.length})` : 'History'}
            </button>
          ))}
        </div>

        {tab === 'active' && (
          <div className="space-y-3">
            {data.active.map((alert) => (
              <Card key={alert.id} className={`p-4 ${severityBg[alert.severity] || ''}`}>
                <div className="flex flex-col sm:flex-row items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant={severityBadge[alert.severity] || 'muted'}>{alert.severity}</Badge>
                      <span className="text-[14px] text-text-primary font-medium">{alert.title}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="muted">{alert.resource}</Badge>
                      <span className="text-[11px] font-mono text-text-muted">
                        {new Date(alert.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                    </div>
                    <div className="mb-2">
                      <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider mb-0.5">Assessment</div>
                      <p className="text-[12px] text-text-secondary">{alert.assessment}</p>
                    </div>
                    <div>
                      <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider mb-0.5">Recommended Action</div>
                      <p className="text-[12px] text-text-secondary">{alert.recommendation}</p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-1.5 shrink-0">
                    <Button size="sm" variant="primary">Auto-fix</Button>
                    <Button size="sm" variant="secondary">Acknowledge</Button>
                    <Button size="sm" variant="ghost">Dismiss</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === 'history' && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[600px]">
              <thead>
                <tr className="border-b border-border-subtle text-text-muted text-[11px] font-mono uppercase tracking-wider">
                  <th className="text-left py-2.5 px-4 font-medium">Title</th>
                  <th className="text-left py-2.5 px-4 font-medium">Severity</th>
                  <th className="text-left py-2.5 px-4 font-medium">Resolved At</th>
                  <th className="text-left py-2.5 px-4 font-medium">Resolved By</th>
                  <th className="text-left py-2.5 px-4 font-medium">Action Taken</th>
                </tr>
              </thead>
              <tbody>
                {data.history.map((h) => (
                  <tr key={h.id} className="border-b border-border-subtle">
                    <td className="py-2.5 px-4 text-text-primary">{h.title}</td>
                    <td className="py-2.5 px-4"><Badge variant={severityBadge[h.severity] || 'muted'}>{h.severity}</Badge></td>
                    <td className="py-2.5 px-4 font-mono text-text-muted text-[12px]">
                      {new Date(h.resolvedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge variant={h.resolvedBy === 'agent' ? 'purple' : 'muted'}>{h.resolvedBy}</Badge>
                    </td>
                    <td className="py-2.5 px-4 text-text-secondary text-[12px]">{h.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
