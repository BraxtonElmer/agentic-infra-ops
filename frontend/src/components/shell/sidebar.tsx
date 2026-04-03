'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GitBranch,
  Server,
  DollarSign,
  Bot,
  Bell,
  Settings,
  Hexagon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusDot } from '@/components/ui/status-dot';
import { useAppStore } from '@/store/use-app-store';
import { useFetch } from '@/lib/use-fetch';

interface SidebarCounts {
  pipelinesFailed: number;
  infraCritical: number;
  finopsWaste: string;
  alertsActive: number;
  agentState: string;
}

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/pipelines', label: 'Pipelines', icon: GitBranch, badgeKey: 'pipelinesFailed' as const },
  { href: '/infrastructure', label: 'Infrastructure', icon: Server, badgeKey: 'infraCritical' as const },
  { href: '/finops', label: 'FinOps', icon: DollarSign, badgeKey: 'finopsWaste' as const },
  { href: '/agent-log', label: 'Agent Log', icon: Bot },
  { href: '/alerts', label: 'Alerts', icon: Bell, badgeKey: 'alertsActive' as const },
];

const badgeVariant: Record<string, 'red' | 'amber'> = {
  pipelinesFailed: 'red',
  infraCritical: 'red',
  finopsWaste: 'amber',
  alertsActive: 'red',
};

export function Sidebar() {
  const pathname = usePathname();
  const openAgentDrawer = useAppStore((s) => s.openAgentDrawer);
  const { data: counts } = useFetch<SidebarCounts>('/api/sidebar-counts');

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[52px] lg:w-[220px] bg-bg-surface border-r border-border-subtle flex-col z-40">
      {/* Logo */}
      <div className="h-[52px] flex items-center gap-2.5 px-4 max-lg:px-0 max-lg:justify-center border-b border-border-subtle">
        <Hexagon className="w-[18px] h-[18px] text-text-muted shrink-0" />
        <div className="max-lg:hidden">
          <div className="text-[13px] font-medium text-text-primary leading-none tracking-tight">Axiom</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          const badgeValue = item.badgeKey && counts ? counts[item.badgeKey] : null;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-2.5 max-lg:px-0 max-lg:justify-center h-8 rounded-[6px] text-[13px] transition-colors ${
                active
                  ? 'bg-white/[0.07] text-text-primary'
                  : 'text-text-secondary hover:bg-white/[0.04] hover:text-text-primary'
              }`}
            >
              <Icon className="w-[16px] h-[16px] shrink-0" />
              <span className="max-lg:hidden flex-1">{item.label}</span>
              {badgeValue !== null && badgeValue !== undefined && (
                <span className="max-lg:hidden flex items-center gap-1">
                  {item.badgeKey === 'alertsActive' && <StatusDot status="critical" pulse size={5} />}
                  <Badge variant={badgeVariant[item.badgeKey!] || 'muted'}>
                    {String(badgeValue)}
                  </Badge>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="px-2 pb-1">
        <Link
          href="/settings"
          className={`flex items-center gap-2.5 px-2.5 max-lg:px-0 max-lg:justify-center h-8 rounded-[6px] text-[13px] transition-colors ${
            pathname === '/settings'
              ? 'bg-white/[0.07] text-text-primary'
              : 'text-text-secondary hover:bg-white/[0.04] hover:text-text-primary'
          }`}
        >
          <Settings className="w-[16px] h-[16px] shrink-0" />
          <span className="max-lg:hidden">Settings</span>
        </Link>
      </div>

      {/* Agent status pill */}
      <button
        onClick={openAgentDrawer}
        className="mx-2 mb-3 flex items-center gap-2 px-2.5 max-lg:px-0 max-lg:justify-center h-7 rounded-[6px] border border-border-subtle text-[12px] hover:border-border-default hover:bg-white/[0.03] transition-colors cursor-pointer"
      >
        <StatusDot
          status={counts?.agentState === 'acting' ? 'warning' : 'healthy'}
          pulse
          size={5}
        />
        <span className="max-lg:hidden text-text-muted font-mono text-[10px] uppercase tracking-wider">agent</span>
        <span className="max-lg:hidden text-text-secondary text-[10px] font-mono">
          {counts?.agentState || 'scanning'}
        </span>
      </button>
    </aside>
  );
}
