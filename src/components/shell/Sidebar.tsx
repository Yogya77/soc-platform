'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  LayoutDashboard,
  Bell,
  AlertTriangle,
  FileText,
  Binary,
  Cpu,
  Fingerprint,
  Server,
  Sliders,
  Settings,
  ChevronLeft,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSecurity } from '@/context/SecurityContext';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: 'critical' | 'warning' | 'info';
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { stats, alerts, incidents } = useSecurity();

  const activeAlertsCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status !== 'DISMISSED' && a.status !== 'RESOLVED').length;
  const activeIncidentsCount = incidents.filter((i) => i.status !== 'CLOSED').length;

  const navGroups: NavGroup[] = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'MONITORING',
      items: [
        { label: 'Alerts', href: '/alerts', icon: Bell, badge: activeAlertsCount > 0 ? activeAlertsCount : undefined, badgeColor: 'critical' },
        { label: 'Incidents', href: '/incidents', icon: AlertTriangle, badge: activeIncidentsCount > 0 ? activeIncidentsCount : undefined, badgeColor: 'warning' },
        { label: 'Events', href: '/events', icon: Binary },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { label: 'Threat Intelligence', href: '/threat-intel', icon: Fingerprint },
        { label: 'AI Analyst', href: '/ai-analyst', icon: Cpu, badge: 'AI', badgeColor: 'info' },
        { label: 'Investigation Reports', href: '/reports', icon: FileText },
      ],
    },
    {
      title: 'ENVIRONMENT',
      items: [
        { label: 'Assets', href: '/assets', icon: Server },
        { label: 'Detection Rules', href: '/rules', icon: Sliders },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { label: 'Settings', href: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        'h-screen bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col justify-between transition-all duration-200 select-none z-30 sticky top-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div>
        <div className="h-14 border-b border-slate-800/80 flex items-center justify-between px-3">
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <ShieldAlert size={18} />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-xs font-bold font-mono-code tracking-wider text-slate-100 uppercase">
                  CYBERSECURITY
                </span>
                <span className="text-[10px] font-mono-code text-slate-400 uppercase tracking-widest">
                  OPERATIONS CENTER
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="py-3 px-2 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!collapsed && (
                <div className="px-2.5 py-1 text-[10px] font-mono-code font-bold uppercase tracking-widest text-slate-400">
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-mono-code font-medium transition-all group',
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                    )}
                  >
                    <Icon
                      size={16}
                      className={cn(
                        'shrink-0 transition-colors',
                        isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                      )}
                    />
                    {!collapsed && (
                      <div className="flex-1 flex items-center justify-between overflow-hidden">
                        <span className="truncate">{item.label}</span>
                        {item.badge !== undefined && (
                          <span
                            className={cn(
                              'text-[10px] px-1.5 py-0.2 rounded font-mono-code font-bold',
                              item.badgeColor === 'critical' && 'bg-red-500/20 text-red-400 border border-red-500/30',
                              item.badgeColor === 'warning' && 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
                              item.badgeColor === 'info' && 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* System Status Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-[#080c14]">
        {!collapsed ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-live-pulse" />
              <span className="text-[11px] font-mono-code font-semibold tracking-wider text-emerald-400">
                SYSTEM OPERATIONAL
              </span>
            </div>
            <div className="text-[10px] font-mono-code text-slate-500">
              Telemetry sync: <span className="text-slate-400">Active</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="System Operational">
            <Radio size={14} className="text-emerald-400 animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
};
