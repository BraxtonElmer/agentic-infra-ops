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
} from 'lucide-react';
import { StatusDot } from '@/components/ui/status-dot';
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
  { href: '/pipelines', label: 'Pipelines', icon: GitBranch },
  { href: '/infrastructure', label: 'Infra', icon: Server },
  { href: '/finops', label: 'FinOps', icon: DollarSign },
  { href: '/agent-log', label: 'Agent', icon: Bot },
  { href: '/alerts', label: 'Alerts', icon: Bell },
];

const alertKeys: Record<string, keyof SidebarCounts> = {
  '/pipelines': 'pipelinesFailed',
  '/infrastructure': 'infraCritical',
  '/alerts': 'alertsActive',
};

export function BottomNav() {
  const pathname = usePathname();
  const { data: counts } = useFetch<SidebarCounts>('/api/sidebar-counts');

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-14 bg-bg-surface border-t border-border-subtle flex items-center md:hidden z-40">
      {navItems.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        const Icon = item.icon;
        const alertKey = alertKeys[item.href];
        const hasAlert = alertKey && counts && Number(counts[alertKey]) > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full relative transition-colors ${
              active ? 'text-text-primary' : 'text-text-muted'
            }`}
          >
            <span className="relative">
              <Icon className="w-[18px] h-[18px]" />
              {hasAlert && (
                <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full bg-accent-red" />
              )}
            </span>
            <span className="text-[9px] font-medium tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
