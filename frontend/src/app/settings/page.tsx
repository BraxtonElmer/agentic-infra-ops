'use client';

import { useState, useEffect } from 'react';
import { Topbar } from '@/components/shell/topbar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useFetch } from '@/lib/use-fetch';

interface SettingsData {
  integrations: {
    repos: { id: string; name: string; url: string; status: string }[];
    servers: { id: string; name: string; host: string; status: string }[];
  };
  llm: {
    provider: string;
    model: string;
    models: Record<string, string[]>;
  };
  thresholds: {
    cpuWarning: number;
    cpuCritical: number;
    ramWarning: number;
    ramCritical: number;
    diskWarning: number;
  };
  agentBehavior: {
    mode: string;
    autoOpenPRs: boolean;
    autoTerminateStale: boolean;
    webhookUrl: string;
  };
}

const sections = [
  { key: 'integrations', label: 'Integrations' },
  { key: 'llm', label: 'LLM Provider' },
  { key: 'thresholds', label: 'Alert Thresholds' },
  { key: 'behavior', label: 'Agent Behavior' },
];

export default function SettingsPage() {
  const { data, isLoading } = useFetch<SettingsData>('/api/settings');
  const [activeSection, setActiveSection] = useState('integrations');
  const [thresholds, setThresholds] = useState({
    cpuWarning: 70, cpuCritical: 90, ramWarning: 75, ramCritical: 90, diskWarning: 80,
  });
  const [provider, setProvider] = useState('groq');
  const [mode, setMode] = useState('suggest');
  const [autoOpenPRs, setAutoOpenPRs] = useState(true);
  const [autoTerminate, setAutoTerminate] = useState(false);

  useEffect(() => {
    if (data) {
      setThresholds(data.thresholds);
      setProvider(data.llm.provider);
      setMode(data.agentBehavior.mode);
      setAutoOpenPRs(data.agentBehavior.autoOpenPRs);
      setAutoTerminate(data.agentBehavior.autoTerminateStale);
    }
  }, [data]);

  if (isLoading || !data) {
    return (
      <>
        <Topbar title="Settings" />
        <div className="p-5">
          <Skeleton className="h-96" />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Settings" />
      <div className="p-4 sm:p-5 flex flex-col md:flex-row gap-5">
        {/* Sub-nav */}
        <div className="flex md:flex-col md:w-48 shrink-0 gap-0.5 overflow-x-auto md:overflow-visible pb-1 md:pb-0 border-b md:border-b-0 md:border-r-0 border-border-subtle md:pr-0">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`md:w-full text-left h-8 px-3 rounded-[6px] text-[13px] transition-colors cursor-pointer whitespace-nowrap ${
                activeSection === s.key ? 'bg-white/[0.07] text-text-primary' : 'text-text-secondary hover:bg-white/[0.04] hover:text-text-primary'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeSection === 'integrations' && (
            <div className="space-y-5">
              <div>
                <div className="section-label mb-3">Connected Repos</div>
                <Card className="p-4 space-y-2">
                  {data.integrations.repos.map((repo) => (
                    <div key={repo.id} className="flex items-center gap-3 py-1.5 border-b border-border-subtle last:border-0">
                      <span className="text-[13px] text-text-primary">{repo.name}</span>
                      <span className="text-[11px] font-mono text-text-muted flex-1">{repo.url}</span>
                      <Badge variant={repo.status === 'connected' ? 'green' : 'amber'}>{repo.status}</Badge>
                    </div>
                  ))}
                  <div className="pt-2">
                    <div className="section-label mb-2">Connect Repo</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Input placeholder="Repository URL" className="flex-1 min-w-[160px]" />
                      <Input placeholder="Access token" className="w-full sm:w-48" type="password" />
                      <Button variant="primary" size="sm">Connect</Button>
                    </div>
                  </div>
                </Card>
              </div>

              <div>
                <div className="section-label mb-3">Connected Servers</div>
                <Card className="p-4 space-y-2">
                  {data.integrations.servers.map((server) => (
                    <div key={server.id} className="flex items-center gap-3 py-1.5 border-b border-border-subtle last:border-0">
                      <span className="text-[13px] text-text-primary">{server.name}</span>
                      <span className="text-[11px] font-mono text-text-muted flex-1">{server.host}</span>
                      <Badge variant="green">{server.status}</Badge>
                    </div>
                  ))}
                  <div className="pt-2">
                    <div className="section-label mb-2">Add Server</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Input placeholder="SSH host" className="flex-1 min-w-[120px]" />
                      <Input placeholder="Port" className="w-16" />
                      <Input placeholder="User" className="w-24" />
                      <Input placeholder="API key or SSH key path" className="flex-1 min-w-[140px]" type="password" />
                      <Button variant="primary" size="sm">Add</Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeSection === 'llm' && (
            <div className="space-y-4">
              <div className="section-label">LLM Provider</div>
              <Card className="p-4 space-y-4">
                <div className="flex items-center gap-4">
                  {['groq', 'ollama', 'gemini'].map((p) => (
                    <label key={p} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="provider"
                        checked={provider === p}
                        onChange={() => setProvider(p)}
                        className=""
                      />
                      <span className={`text-[13px] ${provider === p ? 'text-text-primary' : 'text-text-secondary'}`}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
                <div>
                  <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider block mb-1">API Key</label>
                  <Input type="password" placeholder={`Enter ${provider} API key`} />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider block mb-1">Model</label>
                  <select className="h-9 w-full bg-bg-elevated border border-border-default rounded-[6px] px-3 text-[13px] text-text-primary focus:outline-none focus:border-border-strong transition-colors">
                    {data.llm.models[provider]?.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <Button variant="secondary" size="sm">Test connection</Button>
              </Card>
            </div>
          )}

          {activeSection === 'thresholds' && (
            <div className="space-y-4">
              <div className="section-label">Alert Thresholds</div>
              <Card className="p-4 space-y-5">
                {[
                  { key: 'cpuWarning' as const, label: 'CPU Warning' },
                  { key: 'cpuCritical' as const, label: 'CPU Critical' },
                  { key: 'ramWarning' as const, label: 'RAM Warning' },
                  { key: 'ramCritical' as const, label: 'RAM Critical' },
                  { key: 'diskWarning' as const, label: 'Disk Warning' },
                ].map((t) => (
                  <div key={t.key} className="flex items-center gap-4">
                    <span className="text-[13px] text-text-secondary w-32">{t.label}</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={thresholds[t.key]}
                      onChange={(e) => setThresholds({ ...thresholds, [t.key]: Number(e.target.value) })}
                      className="flex-1 h-1 accent-[var(--text-muted)]"
                    />
                    <span className="text-[13px] font-mono text-text-primary w-10 text-right">{thresholds[t.key]}%</span>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {activeSection === 'behavior' && (
            <div className="space-y-4">
              <div className="section-label">Agent Behavior</div>
              <Card className="p-4 space-y-4">
                <div>
                  <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider mb-2">Agent Mode</div>
                  <div className="flex items-center gap-2">
                    {['suggest', 'auto-fix'].map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`h-8 px-3 rounded-[6px] text-[13px] font-medium transition-colors cursor-pointer ${
                          mode === m ? 'bg-white/[0.07] text-text-primary' : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {m === 'suggest' ? 'Suggest only' : 'Auto-fix'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 border-t border-border-subtle pt-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[13px] text-text-secondary">Auto-open PRs</span>
                    <button
                      onClick={() => setAutoOpenPRs(!autoOpenPRs)}
                      className={`w-9 h-5 rounded-full transition-colors cursor-pointer ${autoOpenPRs ? 'bg-border-strong' : 'bg-bg-overlay'}`}
                    >
                      <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform mx-0.5 ${autoOpenPRs ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[13px] text-text-secondary">Auto-terminate stale containers</span>
                    <button
                      onClick={() => setAutoTerminate(!autoTerminate)}
                      className={`w-9 h-5 rounded-full transition-colors cursor-pointer ${autoTerminate ? 'bg-border-strong' : 'bg-bg-overlay'}`}
                    >
                      <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform mx-0.5 ${autoTerminate ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </label>
                </div>
                <div className="border-t border-border-subtle pt-3">
                  <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider block mb-1">Webhook URL</label>
                  <Input defaultValue={data.agentBehavior.webhookUrl} />
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
