'use client';

import { Topbar } from '@/components/shell/topbar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricBar } from '@/components/ui/metric-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { useFetch } from '@/lib/use-fetch';

interface Server {
  id: string; name: string; instanceType: string; region: string; uptime: string;
  cpu: number; ram: number; disk: number; netIn: string; netOut: string; critical: boolean;
}

interface Container {
  id: string; name: string; image: string; cpu: number; ram: number; netIO: string;
  uptime: string; status: string; idleDays?: number;
}

interface StaleResource {
  id: string; type: string; name: string; lastActive: string; costPerMonth: string;
}

interface InfraData {
  servers: Server[];
  containers: Container[];
  staleResources: StaleResource[];
}

const statusBadge: Record<string, 'green' | 'blue' | 'amber' | 'red'> = {
  running: 'green', idle: 'amber', zombie: 'red',
};

const resourceTypeBadge: Record<string, 'amber' | 'red' | 'muted'> = {
  container: 'amber', volume: 'muted', zombie: 'red',
};

export default function InfrastructurePage() {
  const { data, isLoading } = useFetch<InfraData>('/api/infrastructure');

  if (isLoading || !data) {
    return (
      <>
        <Topbar title="Infrastructure" />
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Infrastructure" primaryAction={{ label: 'Add server' }} />
      <div className="p-5 space-y-5">
        {/* Servers */}
        <div className="section-label">Servers</div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.servers.map((s) => (
            <Card key={s.id} className={`p-4 ${s.critical ? 'border-accent-red/20' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] font-mono text-text-primary">{s.name}</span>
                <Badge variant="green">{s.uptime}</Badge>
              </div>
              <div className="text-[11px] text-text-muted mb-3">
                {s.instanceType} · {s.region}
              </div>
              <div className="space-y-2 mb-3">
                <MetricBar value={s.cpu} label="CPU" />
                <MetricBar value={s.ram} label="RAM" />
                <MetricBar value={s.disk} label="DSK" />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
                <span>IN {s.netIn}</span>
                <span>OUT {s.netOut}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Containers */}
        <div className="section-label">Containers</div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border-subtle text-text-muted text-[11px] font-mono uppercase tracking-wider">
                  <th className="text-left py-2.5 px-4 font-medium">Name</th>
                  <th className="text-left py-2.5 px-4 font-medium">Image</th>
                  <th className="text-left py-2.5 px-4 font-medium">CPU%</th>
                  <th className="text-left py-2.5 px-4 font-medium">RAM%</th>
                  <th className="text-left py-2.5 px-4 font-medium">Net I/O</th>
                  <th className="text-left py-2.5 px-4 font-medium">Uptime</th>
                  <th className="text-left py-2.5 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.containers.map((c) => (
                  <tr
                    key={c.id}
                    className={`border-b border-border-subtle ${
                      c.status === 'idle' ? 'border-l-2 border-l-accent-amber' : c.status === 'zombie' ? 'border-l-2 border-l-accent-red' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 font-mono text-text-primary">{c.name}</td>
                    <td className="py-2.5 px-4 font-mono text-text-secondary text-[12px]">{c.image}</td>
                    <td className="py-2.5 px-4 font-mono text-text-secondary text-[12px]">{c.cpu}%</td>
                    <td className="py-2.5 px-4 font-mono text-text-secondary text-[12px]">{c.ram}%</td>
                    <td className="py-2.5 px-4 font-mono text-text-muted text-[12px]">{c.netIO}</td>
                    <td className="py-2.5 px-4 font-mono text-text-muted text-[12px]">{c.uptime}</td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={statusBadge[c.status] || 'muted'}>{c.status}</Badge>
                        {c.idleDays && <Badge variant="amber">idle {c.idleDays}d</Badge>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Stale resources */}
        <div className="section-label">Stale Resource Flags</div>
        <Card className="p-4">
          <div className="space-y-2">
            {data.staleResources.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-2 border-b border-border-subtle last:border-0">
                <Badge variant={resourceTypeBadge[r.type] || 'muted'}>{r.type}</Badge>
                <span className="text-[13px] font-mono text-text-primary flex-1">{r.name}</span>
                <span className="text-[11px] text-text-muted">Last active: {r.lastActive}</span>
                <span className="text-[12px] font-mono text-accent-red">{r.costPerMonth}/mo</span>
                <Button size="sm" variant="secondary">Flag for removal</Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
