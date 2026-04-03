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
    <header className="h-[52px] sticky top-0 bg-bg-base/80 backdrop-blur-sm border-b border-border-subtle flex items-center justify-between px-5 z-30">
      <h1 className="text-[14px] font-medium text-text-primary">{title}</h1>

      {now && (
        <span className="text-[12px] font-mono text-text-muted hidden sm:block">
          {now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          {' '}
          {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </span>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-8 h-8 flex items-center justify-center rounded-[6px] text-text-secondary hover:bg-bg-elevated transition-colors cursor-pointer"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <Button variant="ghost" size="sm" onClick={toggleAgentDrawer}>
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">View agent log</span>
        </Button>

        {primaryAction && (
          <Button variant="primary" size="sm" onClick={primaryAction.onClick}>
            {primaryAction.label}
          </Button>
        )}
      </div>
    </header>
  );
}
