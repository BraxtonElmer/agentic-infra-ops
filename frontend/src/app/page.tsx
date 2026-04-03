'use client';

import { Topbar } from '@/components/shell/topbar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusDot } from '@/components/ui/status-dot';
import { MetricBar } from '@/components/ui/metric-bar';
import { AgentInsight } from '@/components/ui/agent-insight';
import { Skeleton } from '@/components/ui/skeleton';
import { useFetch } from '@/lib/use-fetch';

interface OverviewData {
  healthScore: number;
  healthStatus: string;
  monthlyWaste: string;
  activeIncidents: number;
  agentActionsToday: number;
  alerts: { id: string; severity: string; title: string; detail: string; resource: string }[];
  pipelines: { id: string; repo: string; branch: string; status: string; error: string | null; duration: string | null; time: string; insight: string | null }[];
  agentLog: { id: string; timestamp: string; type: string; target: string; message: string }[];
  servers: { id: string; name: string; cpu: number; ram: number; disk: number }[];
  finops: { totalCost: string; totalWaste: string; services: { name: string; cost: number; waste: number; total: number }[]; agentSavings: string };
}

const typeBadge: Record<string, 'blue' | 'green' | 'purple' | 'amber' | 'red'> = {
  scan: 'blue',
  fix: 'green',
  diagnose: 'purple',
  recommend: 'amber',
  flag: 'red',
};

export default function OverviewPage() {
  const { data, isLoading } = useFetch<OverviewData>('/api/overview');

  if (isLoading || !data) {
    return (
      <>
        <Topbar title="Overview" />
        <div className="p-4 sm:p-5 space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-40" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </>
    );
  }

  const maxCost = Math.max(...data.finops.services.map((s) => s.cost));

  return (
    <>
      <Topbar title="Overview" primaryAction={{ label: 'Run full scan' }} />
      <div className="p-4 sm:p-5 space-y-5">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <StatusDot status={data.healthStatus === 'green' ? 'healthy' : data.healthStatus === 'amber' ? 'warning' : 'critical'} size={5} />
              <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider">Health Score</div>
            </div>
            <div className="text-[32px] font-mono font-medium leading-none text-text-primary">
              {data.healthScore}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider mb-2">Monthly Waste</div>
            <div className="text-[32px] font-mono font-medium leading-none text-text-primary">{data.monthlyWaste}</div>
          </Card>
          <Card className="p-4">
            <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider mb-2">Active Incidents</div>
            <div className="text-[32px] font-mono font-medium leading-none text-text-primary">{data.activeIncidents}</div>
          </Card>
          <Card className="p-4">
            <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider mb-2">Agent Actions Today</div>
            <div className="text-[32px] font-mono font-medium leading-none text-text-primary">{data.agentActionsToday}</div>
          </Card>
        </div>

        {/* Active alerts */}
        <div className="space-y-2">
          <div className="section-label">Active Alerts</div>
          {data.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex flex-col sm:flex-row items-start gap-3 p-3 bg-bg-surface border border-border-subtle rounded-[6px] ${
                alert.severity === 'critical' ? 'border-l-2 border-l-accent-red/60' : 'border-l-2 border-l-accent-amber/60'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={alert.severity === 'critical' ? 'red' : 'amber'}>{alert.severity}</Badge>
                  <span className="text-[13px] text-text-primary font-medium">{alert.title}</span>
                </div>
                <p className="text-[12px] text-text-secondary">{alert.detail}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="primary">Auto-fix</Button>
                <Button size="sm" variant="ghost">Dismiss</Button>
              </div>
            </div>
          ))}
        </div>

        {/* Pipelines + Agent Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="section-label mb-3">Recent Pipelines</div>
            <div className="space-y-0">
              {data.pipelines.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border-subtle last:border-0">
                  <StatusDot status={p.status as 'pass' | 'fail' | 'running'} size={7} />
                  <span className="text-[13px] text-text-primary flex-1">{p.repo}</span>
                  <Badge variant="muted">{p.branch}</Badge>
                  {p.error && <Badge variant="red">{p.error}</Badge>}
                  {p.duration && <span className="text-[11px] font-mono text-text-secondary">{p.duration}</span>}
                  <span className="text-[11px] font-mono text-text-muted">{p.time}</span>
                </div>
              ))}
            </div>
            {data.pipelines.find((p) => p.insight) && (
              <div className="mt-3">
                <AgentInsight
                  label="agent · diagnosis"
                  description={data.pipelines.find((p) => p.insight)!.insight!}
                  actionText="View fix PR"
                />
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="section-label mb-3">Agent Log</div>
            <div className="space-y-2">
              {data.agentLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-2 py-1.5">
                  <span className="text-[10px] font-mono text-text-muted shrink-0 mt-0.5">{entry.timestamp}</span>
                  <Badge variant="muted">{entry.type}</Badge>
                  <p className="text-[12px] text-text-secondary leading-relaxed">{entry.message}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Infrastructure + FinOps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="section-label mb-3">Infrastructure</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {data.servers.map((s) => (
                <Card key={s.id} className="p-3">
                  <div className="text-[12px] font-mono text-text-primary mb-2">{s.name}</div>
                  <div className="space-y-1.5">
                    <MetricBar value={s.cpu} label="CPU" />
                    <MetricBar value={s.ram} label="RAM" />
                    <MetricBar value={s.disk} label="DSK" />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Card className="p-4">
            <div className="section-label mb-3">FinOps</div>
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-[11px] text-text-muted">Total</span>
              <span className="text-[18px] font-mono text-text-primary">{data.finops.totalCost}</span>
              <span className="text-[11px] text-text-muted">Waste</span>
              <span className="text-[14px] font-mono text-text-secondary">{data.finops.totalWaste}</span>
            </div>
            <div className="space-y-2">
              {data.finops.services.map((svc) => (
                <div key={svc.name} className="flex items-center gap-3">
                  <span className="text-[12px] text-text-secondary w-32 shrink-0 truncate">{svc.name}</span>
                  <div className="flex-1 h-[4px] bg-bg-overlay rounded-[2px] overflow-hidden flex">
                    <div className="h-full bg-border-strong rounded-l-[2px]" style={{ width: `${((svc.cost - svc.waste) / maxCost) * 100}%` }} />
                    {svc.waste > 0 && (
                      <div className="h-full bg-accent-red" style={{ width: `${(svc.waste / maxCost) * 100}%` }} />
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-text-muted w-16 text-right">₹{(svc.cost / 1000).toFixed(1)}k</span>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <AgentInsight
                label="agent · savings"
                description={data.finops.agentSavings}
                actionText="View all recommendations"
              />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
