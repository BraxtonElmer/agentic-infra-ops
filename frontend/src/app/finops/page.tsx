'use client';

import { Topbar } from '@/components/shell/topbar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AgentInsight } from '@/components/ui/agent-insight';
import { Skeleton } from '@/components/ui/skeleton';
import { useFetch } from '@/lib/use-fetch';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';

interface FinOpsData {
  totalCost: string;
  totalWaste: string;
  potentialSavings: string;
  breakdown: { service: string; cost: number; waste: number }[];
  trend: { day: string; cost: number }[];
  wasteItems: { id: string; name: string; type: string; costPerMonth: string; recommendation: string }[];
  actionsLog: { id: string; action: string; resource: string; saving: string; timestamp: string; status: string }[];
}

export default function FinOpsPage() {
  const { data, isLoading } = useFetch<FinOpsData>('/api/finops');

  if (isLoading || !data) {
    return (
      <>
        <Topbar title="FinOps" />
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="FinOps" primaryAction={{ label: 'Run cost scan' }} />
      <div className="p-4 sm:p-5 space-y-5">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider mb-2">Total Monthly Cost</div>
            <div className="text-[28px] font-mono font-medium leading-none text-text-primary">{data.totalCost}</div>
          </Card>
          <Card className="p-4">
            <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider mb-2">Total Waste</div>
            <div className="text-[28px] font-mono font-medium leading-none text-text-primary">{data.totalWaste}</div>
          </Card>
          <Card className="p-4">
            <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider mb-2">Potential Savings</div>
            <div className="text-[28px] font-mono font-medium leading-none text-text-primary">{data.potentialSavings}</div>
          </Card>
        </div>

        {/* Cost breakdown chart */}
        <Card className="p-4">
          <div className="section-label mb-3">Cost Breakdown by Service</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...data.breakdown].sort((a, b) => b.cost - a.cost)} layout="vertical" barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="service" type="category" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={130} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, fontSize: 12 }}
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                />
                <Bar dataKey="cost" fill="var(--border-strong)" radius={[0, 2, 2, 0]} barSize={14} />
                <Bar dataKey="waste" fill="var(--accent-red)" radius={[0, 2, 2, 0]} barSize={14} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Cost trend */}
        <Card className="p-4">
          <div className="section-label mb-3">Cost Trend (30 days)</div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} width={45} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, fontSize: 12 }}
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Daily Cost']}
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="var(--text-primary)"
                  strokeWidth={2}
                  fill="var(--bg-elevated)"
                  fillOpacity={1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Waste items */}
        <div className="section-label">Wasted Resources</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.wasteItems.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[13px] font-mono text-text-primary">{item.name}</span>
                <Badge variant="muted">{item.type}</Badge>
                <span className="text-[13px] font-mono text-accent-red ml-auto">{item.costPerMonth}/mo</span>
              </div>
              <AgentInsight
                label="agent · recommendation"
                description={item.recommendation}
                actionText="Apply recommendation"
              />
            </Card>
          ))}
        </div>

        {/* Actions log */}
        <Card className="overflow-hidden">
          <div className="section-label px-4 pt-4 mb-3">Actions Taken</div>
          <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[500px]">
            <thead>
              <tr className="border-b border-border-subtle text-text-muted text-[11px] font-mono uppercase tracking-wider">
                <th className="text-left py-2.5 px-4 font-medium">Action</th>
                <th className="text-left py-2.5 px-4 font-medium">Resource</th>
                <th className="text-left py-2.5 px-4 font-medium">Saving</th>
                <th className="text-left py-2.5 px-4 font-medium">Timestamp</th>
                <th className="text-left py-2.5 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.actionsLog.map((a) => (
                <tr key={a.id} className="border-b border-border-subtle">
                  <td className="py-2.5 px-4 text-text-primary">{a.action}</td>
                  <td className="py-2.5 px-4 font-mono text-text-secondary text-[12px]">{a.resource}</td>
                  <td className="py-2.5 px-4 font-mono text-text-secondary text-[12px]">{a.saving}</td>
                  <td className="py-2.5 px-4 font-mono text-text-muted text-[12px]">
                    {new Date(a.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="py-2.5 px-4">
                    <Badge variant={a.status === 'completed' ? 'green' : 'amber'}>{a.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      </div>
    </>
  );
}
