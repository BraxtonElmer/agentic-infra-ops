'use client';

import { useState, useRef, useEffect } from 'react';
import { Topbar } from '@/components/shell/topbar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusDot } from '@/components/ui/status-dot';
import { Skeleton } from '@/components/ui/skeleton';
import { useFetch } from '@/lib/use-fetch';
import { X, ChevronRight, ChevronDown, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

interface Pipeline {
  id: string; repo: string; branch: string; triggeredBy: string; status: string; error: string | null;
  duration: string | null; timestamp: string; log: string | null;
  diagnosis: { rootCause: string; affectedFile: string; recommendation: string } | null;
  diff: { removed: string; added: string } | null;
}

interface AutoFix {
  id: string; title: string; repo: string; status: string; timestamp: string;
}

interface PipelinesData {
  pipelines: Pipeline[];
  trend: { day: string; pass: number; fail: number }[];
  autoFixHistory: AutoFix[];
}

const statusBadge: Record<string, 'green' | 'red' | 'blue' | 'muted'> = {
  pass: 'green', fail: 'red', running: 'blue',
};

const prStatusBadge: Record<string, 'green' | 'purple' | 'muted'> = {
  open: 'green', merged: 'purple', closed: 'muted',
};

export default function PipelinesPage() {
  const { data, isLoading } = useFetch<PipelinesData>('/api/pipelines');
  const [repoFilter, setRepoFilter] = useState('all');
  const [repoSearch, setRepoSearch] = useState('');
  const [repoOpen, setRepoOpen] = useState(false);
  const [branchFilter, setBranchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [drawerTab, setDrawerTab] = useState<'log' | 'diagnosis' | 'diff'>('log');
  const repoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (repoRef.current && !repoRef.current.contains(e.target as Node)) {
        setRepoOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading || !data) {
    return (
      <>
        <Topbar title="Pipelines" />
        <div className="p-4 sm:p-5 space-y-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-96" />
        </div>
      </>
    );
  }

  const allRepos = [...new Set(data.pipelines.map((p) => p.repo))];
  const filteredRepos = allRepos.filter((r) =>
    r.toLowerCase().includes(repoSearch.toLowerCase())
  );

  // Branches scoped to the selected repo only
  const branchesForRepo = repoFilter === 'all'
    ? [...new Set(data.pipelines.map((p) => p.branch))]
    : [...new Set(data.pipelines.filter((p) => p.repo === repoFilter).map((p) => p.branch))];

  const filtered = data.pipelines.filter((p) => {
    if (repoFilter !== 'all' && p.repo !== repoFilter) return false;
    if (branchFilter !== 'all' && p.branch !== branchFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <>
      <Topbar title="Pipelines" primaryAction={{ label: 'Trigger run' }} />
      <div className="p-4 sm:p-5 space-y-5">
        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">

          {/* Repo searchable combo */}
          <div ref={repoRef} className="relative">
            <button
              onClick={() => { setRepoOpen((v) => !v); setRepoSearch(''); }}
              className="h-9 min-w-[160px] flex items-center justify-between gap-2 bg-bg-elevated border border-border-default rounded-[6px] px-3 text-[13px] hover:border-border-strong transition-colors cursor-pointer"
            >
              <span className={repoFilter === 'all' ? 'text-text-muted' : 'text-text-primary'}>
                {repoFilter === 'all' ? 'All repos' : repoFilter}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
            </button>
            {repoOpen && (
              <div className="absolute top-full left-0 mt-1 w-60 bg-bg-elevated border border-border-default rounded-[6px] z-20 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle">
                  <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <input
                    autoFocus
                    value={repoSearch}
                    onChange={(e) => setRepoSearch(e.target.value)}
                    placeholder="Search repos..."
                    className="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-muted outline-none"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto py-1">
                    <button
                    onClick={() => { setRepoFilter('all'); setBranchFilter('all'); setRepoOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-[13px] transition-colors cursor-pointer ${
                      repoFilter === 'all' ? 'bg-bg-overlay text-text-primary' : 'text-text-muted hover:bg-bg-overlay'
                    }`}
                  >
                    All repos
                  </button>
                  {filteredRepos.map((r) => (
                    <button
                      key={r}
                      onClick={() => { setRepoFilter(r); setBranchFilter('all'); setRepoOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 text-[13px] transition-colors cursor-pointer ${
                        repoFilter === r ? 'bg-bg-overlay text-text-primary' : 'text-text-secondary hover:bg-bg-overlay'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Branch dropdown — scoped to selected repo */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            disabled={branchesForRepo.length === 0}
            className="h-9 bg-bg-elevated border border-border-default rounded-[6px] px-3 text-[13px] text-text-primary focus:outline-none focus:border-border-strong transition-colors cursor-pointer disabled:opacity-40"
          >
            <option value="all">All branches</option>
            {branchesForRepo.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>

          {/* Status pills */}
          <div className="flex items-center gap-1">
            {['all', 'pass', 'fail', 'running'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`h-7 px-2.5 rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer ${
                  statusFilter === s ? 'bg-bg-elevated text-text-primary' : 'text-text-secondary hover:bg-bg-elevated'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border-subtle text-text-muted text-[11px] font-mono uppercase tracking-wider">
                  <th className="text-left py-2.5 px-4 font-medium">Repo</th>
                  <th className="text-left py-2.5 px-4 font-medium">Branch</th>
                  <th className="text-left py-2.5 px-4 font-medium">Triggered</th>
                  <th className="text-left py-2.5 px-4 font-medium">Status</th>
                  <th className="text-left py-2.5 px-4 font-medium">Duration</th>
                  <th className="text-left py-2.5 px-4 font-medium">Time</th>
                  <th className="text-right py-2.5 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-b border-border-subtle hover:bg-bg-elevated/50 transition-colors ${p.status === 'fail' ? 'cursor-pointer' : ''}`}
                    onClick={() => p.status === 'fail' && (setSelectedPipeline(p), setDrawerTab('log'))}
                  >
                    <td className="py-2.5 px-4 text-text-primary">{p.repo}</td>
                    <td className="py-2.5 px-4"><Badge variant="muted">{p.branch}</Badge></td>
                    <td className="py-2.5 px-4 text-text-secondary">{p.triggeredBy}</td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <StatusDot status={p.status as 'pass' | 'fail' | 'running'} pulse={p.status === 'running'} />
                        <Badge variant={statusBadge[p.status] || 'muted'}>{p.status}</Badge>
                        {p.error && <Badge variant="red">{p.error}</Badge>}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-text-secondary text-[12px]">{p.duration || '—'}</td>
                    <td className="py-2.5 px-4 font-mono text-text-muted text-[12px]">
                      {new Date(p.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {p.status === 'fail' && (
                        <ChevronRight className="w-4 h-4 text-text-muted inline" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Trend chart */}
        <Card className="p-4">
          <div className="section-label mb-3">Pass / Fail Trend (7 days)</div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trend} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Bar dataKey="pass" fill="var(--accent-green)" opacity={0.4} radius={[2, 2, 0, 0]} />
                <Bar dataKey="fail" fill="var(--accent-red)" opacity={0.4} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Auto-fix history */}
        <Card className="overflow-hidden">
          <div className="section-label px-4 pt-4 mb-3">Auto-fix History</div>
          <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[400px]">
            <thead>
              <tr className="border-b border-border-subtle text-text-muted text-[11px] font-mono uppercase tracking-wider">
                <th className="text-left py-2.5 px-4 font-medium">PR Title</th>
                <th className="text-left py-2.5 px-4 font-medium">Repo</th>
                <th className="text-left py-2.5 px-4 font-medium">Status</th>
                <th className="text-left py-2.5 px-4 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {data.autoFixHistory.map((af) => (
                <tr key={af.id} className="border-b border-border-subtle">
                  <td className="py-2.5 px-4 text-text-primary">{af.title}</td>
                  <td className="py-2.5 px-4 font-mono text-text-secondary text-[12px]">{af.repo}</td>
                  <td className="py-2.5 px-4"><Badge variant={prStatusBadge[af.status] || 'muted'}>{af.status}</Badge></td>
                  <td className="py-2.5 px-4 font-mono text-text-muted text-[12px]">
                    {new Date(af.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      </div>

      {/* Pipeline detail drawer */}
      {selectedPipeline && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedPipeline(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[520px] bg-bg-surface border-l border-border-subtle z-50 flex flex-col">
            <div className="h-[52px] flex items-center justify-between px-4 border-b border-border-subtle shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-text-primary">{selectedPipeline.repo}</span>
                <Badge variant="red">{selectedPipeline.error}</Badge>
              </div>
              <button onClick={() => setSelectedPipeline(null)} className="w-7 h-7 flex items-center justify-center rounded-[6px] text-text-secondary hover:bg-bg-elevated cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-border-subtle">
              {(['log', 'diagnosis', 'diff'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDrawerTab(tab)}
                  className={`h-7 px-2.5 rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer ${
                    drawerTab === tab ? 'bg-bg-elevated text-text-primary' : 'text-text-secondary hover:bg-bg-elevated'
                  }`}
                >
                  {tab === 'log' ? 'Log Output' : tab === 'diagnosis' ? 'Agent Diagnosis' : 'Suggested Diff'}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {drawerTab === 'log' && selectedPipeline.log && (
                <pre className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                  {selectedPipeline.log.split('\n').map((line, i) => (
                    <div key={i} className={line.includes('Error') || line.includes('FATAL') || line.includes('error') ? 'text-accent-red' : 'text-text-secondary'}>
                      {line}
                    </div>
                  ))}
                </pre>
              )}
              {drawerTab === 'diagnosis' && selectedPipeline.diagnosis && (
                <div className="space-y-4">
                  <div>
                    <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider mb-1">Root Cause</div>
                    <p className="text-[13px] text-text-primary">{selectedPipeline.diagnosis.rootCause}</p>
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider mb-1">Affected File</div>
                    <span className="font-mono text-[12px] text-text-secondary">{selectedPipeline.diagnosis.affectedFile}</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider mb-1">Recommendation</div>
                    <p className="text-[13px] text-text-secondary">{selectedPipeline.diagnosis.recommendation}</p>
                  </div>
                </div>
              )}
              {drawerTab === 'diff' && selectedPipeline.diff && (
                <div className="space-y-2 font-mono text-[12px]">
                  <div className="bg-accent-red-bg border border-accent-red/18 rounded-[6px] p-3">
                    <span className="text-accent-red">- {selectedPipeline.diff.removed}</span>
                  </div>
                  <div className="bg-accent-green-bg border border-accent-green/18 rounded-[6px] p-3">
                    {selectedPipeline.diff.added.split('\n').map((line, i) => (
                      <div key={i} className="text-accent-green">+ {line}</div>
                    ))}
                  </div>
                </div>
              )}
              {drawerTab === 'diff' && !selectedPipeline.diff && (
                <p className="text-text-muted text-[13px]">No diff available for this failure.</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-subtle">
              <Button variant="ghost" onClick={() => setSelectedPipeline(null)}>Dismiss</Button>
              <Button variant="primary">Apply fix and open PR</Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
