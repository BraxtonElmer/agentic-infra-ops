'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/use-app-store';
import { useEffect, useState } from 'react';

interface TopbarProps {
  title: string;
  primaryAction?: { label: string; onClick?: () => void };
}

export function Topbar({ title, primaryAction }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const toggleAgentDrawer = useAppStore((s) => s.toggleAgentDrawer);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="h-[52px] sticky top-0 bg-bg-base border-b border-border-subtle flex items-center justify-between px-4 z-30">
      <h1 className="text-[14px] font-medium text-text-primary truncate mr-2">{title}</h1>

      {now && (
        <span className="text-[11px] font-mono text-text-muted hidden lg:block shrink-0">
          {now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          {' '}
          {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </span>
      )}

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-8 h-8 flex items-center justify-center rounded-[6px] text-text-secondary hover:bg-bg-elevated transition-colors cursor-pointer"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleAgentDrawer}
          className="w-8 h-8 flex items-center justify-center rounded-[6px] text-text-secondary hover:bg-bg-elevated transition-colors cursor-pointer"
          aria-label="View agent log"
        >
          <Bot className="w-4 h-4" />
        </button>

        {primaryAction && (
          <Button variant="primary" size="sm" onClick={primaryAction.onClick}>
            <span className="hidden sm:inline">{primaryAction.label}</span>
            <span className="sm:hidden">Run</span>
          </Button>
        )}
      </div>
    </header>
  );
}
