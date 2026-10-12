'use client';

import React from 'react';
import { useSecurity } from '@/context/SecurityContext';
import { MetricCard } from '@/components/common/MetricCard';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/lib/utils';
import {
  ShieldAlert,
  AlertTriangle,
  Activity,
  Server,
  ArrowRight,
  Radio,
  Cpu,
  FileText,
  Binary,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { stats, alerts, incidents, assets, loading } = useSecurity();

  const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL');
  const activeIncidents = incidents.filter((i) => i.status !== 'CLOSED');
  const topRiskyAssets = [...assets].sort((a, b) => b.riskScore - a.riskScore).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a] border border-slate-800/80 rounded p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-live-pulse" />
            <h1 className="text-sm font-mono-code font-bold uppercase tracking-wider text-slate-100">
              SECURITY OPERATIONS CENTER // LIVE TELEMETRY
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time monitoring across Windows endpoints, domain controllers, and SIEM correlation engines.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-mono-code text-slate-500 uppercase tracking-widest">
              TELEMETRY STATE
            </div>
            <div className="text-xs font-mono-code font-semibold text-emerald-400">
              {stats?.systemStatus || 'LIVE'}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-right">
            <div className="text-[10px] font-mono-code text-slate-500 uppercase tracking-widest">
              LAST SYNC
            </div>
            <div className="text-xs font-mono-code text-slate-300">
              {stats ? new Date(stats.lastSyncTime).toLocaleTimeString() : 'Syncing...'}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/alerts?severity=CRITICAL">
          <MetricCard
            title="Critical Alerts"
            value={loading ? '...' : stats?.criticalAlertsCount ?? criticalAlerts.length}
            subtitle="Requires immediate analyst triage"
            severityColor="critical"
            icon={ShieldAlert}
            trend={{ value: `${criticalAlerts.length} active`, isPositive: false }}
          />
        </Link>
        <Link href="/alerts?severity=HIGH">
          <MetricCard
            title="High Alerts"
            value={loading ? '...' : stats?.highAlertsCount ?? 8}
            subtitle="Elevated risk detections"
            severityColor="high"
            icon={AlertTriangle}
            trend={{ value: 'Stable', isPositive: true }}
          />
        </Link>
        <Link href="/incidents">
          <MetricCard
            title="Active Incidents"
            value={loading ? '...' : stats?.activeIncidentsCount ?? activeIncidents.length}
            subtitle="Multi-host attack progressions"
            severityColor="medium"
            icon={Activity}
            trend={{ value: '1 In Progress', isPositive: false }}
          />
        </Link>
        <Link href="/events">
          <MetricCard
            title="24h Event Volume"
            value={loading ? '...' : stats?.eventsLast24Hours?.toLocaleString() ?? '24,891'}
            subtitle="Windows Security Log stream"
            severityColor="healthy"
            icon={Server}
            trend={{ value: '142.8 eps', isPositive: true }}
          />
        </Link>
      </div>

      {/* Security Pipeline Interactive Workflow */}
      <div className="bg-[#0f172a] border border-slate-800/80 rounded p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-blue-400" />
            <h2 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-200">
              End-to-End Security Pipeline (Interactive Workflow)
            </h2>
          </div>
          <span className="text-[10px] font-mono-code text-slate-500">
            Click any stage to inspect live state
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/events"
            className="p-3 bg-[#080c14] border border-slate-800 rounded hover:border-blue-500/50 transition-colors group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <Binary size={14} className="group-hover:text-blue-400 transition-colors" />
                <span className="text-[9px] font-mono-code">STAGE 1</span>
              </div>
              <div className="text-xs font-mono-code font-bold text-slate-200 group-hover:text-blue-400">
                Windows Events
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono-code">4624, 4625, 4688, 7045</div>
            </div>
            <div className="mt-3 text-[10px] text-blue-400 font-mono-code flex items-center gap-1">
              <span>View Logs</span>
              <ArrowRight size={10} />
            </div>
          </Link>

          <Link
            href="/rules"
            className="p-3 bg-[#080c14] border border-slate-800 rounded hover:border-blue-500/50 transition-colors group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <Sliders size={14} className="group-hover:text-blue-400 transition-colors" />
                <span className="text-[9px] font-mono-code">STAGE 2</span>
              </div>
              <div className="text-xs font-mono-code font-bold text-slate-200 group-hover:text-blue-400">
                Detection Rules
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono-code">Sigma SIEM logic</div>
            </div>
            <div className="mt-3 text-[10px] text-blue-400 font-mono-code flex items-center gap-1">
              <span>Inspect Rules</span>
              <ArrowRight size={10} />
            </div>
          </Link>

          <Link
            href="/alerts/ALT-2026-8812"
            className="p-3 bg-[#080c14] border border-slate-800 rounded hover:border-orange-500/50 transition-colors group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <ShieldAlert size={14} className="group-hover:text-orange-400 transition-colors" />
                <span className="text-[9px] font-mono-code">STAGE 3</span>
              </div>
              <div className="text-xs font-mono-code font-bold text-slate-200 group-hover:text-orange-400">
                Alert Triage
              </div>
              <div className="text-[10px] text-orange-400 mt-1 font-mono-code truncate">ALT-2026-8812</div>
            </div>
            <div className="mt-3 text-[10px] text-orange-400 font-mono-code flex items-center gap-1">
              <span>Investigate</span>
              <ArrowRight size={10} />
            </div>
          </Link>

          <Link
            href="/incidents/INC-2026-0421"
            className="p-3 bg-[#080c14] border border-slate-800 rounded hover:border-red-500/50 transition-colors group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <AlertTriangle size={14} className="group-hover:text-red-400 transition-colors" />
                <span className="text-[9px] font-mono-code">STAGE 4</span>
              </div>
              <div className="text-xs font-mono-code font-bold text-slate-200 group-hover:text-red-400">
                Incident Command
              </div>
              <div className="text-[10px] text-red-400 mt-1 font-mono-code truncate">INC-2026-0421</div>
            </div>
            <div className="mt-3 text-[10px] text-red-400 font-mono-code flex items-center gap-1">
              <span>Command Hub</span>
              <ArrowRight size={10} />
            </div>
          </Link>

          <Link
            href="/ai-analyst"
            className="p-3 bg-[#080c14] border border-slate-800 rounded hover:border-purple-500/50 transition-colors group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <Cpu size={14} className="group-hover:text-purple-400 transition-colors" />
                <span className="text-[9px] font-mono-code">STAGE 5</span>
              </div>
              <div className="text-xs font-mono-code font-bold text-slate-200 group-hover:text-purple-400">
                AI Reasoning
              </div>
              <div className="text-[10px] text-purple-400 mt-1 font-mono-code">8-Step Sequence</div>
            </div>
            <div className="mt-3 text-[10px] text-purple-400 font-mono-code flex items-center gap-1">
              <span>Run AI Agent</span>
              <ArrowRight size={10} />
            </div>
          </Link>

          <Link
            href="/reports"
            className="p-3 bg-[#080c14] border border-slate-800 rounded hover:border-emerald-500/50 transition-colors group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <FileText size={14} className="group-hover:text-emerald-400 transition-colors" />
                <span className="text-[9px] font-mono-code">STAGE 6</span>
              </div>
              <div className="text-xs font-mono-code font-bold text-slate-200 group-hover:text-emerald-400">
                Executive Report
              </div>
              <div className="text-[10px] text-emerald-400 mt-1 font-mono-code">REP-2026-0421</div>
            </div>
            <div className="mt-3 text-[10px] text-emerald-400 font-mono-code flex items-center gap-1">
              <span>View Report</span>
              <ArrowRight size={10} />
            </div>
          </Link>
        </div>
      </div>

      {/* Critical Alerts & Top Risky Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Alerts Queue */}
        <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800/80 rounded p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-red-400" />
              <h2 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-200">
                Recent Critical Detections
              </h2>
            </div>
            <Link href="/alerts" className="text-xs font-mono-code text-blue-400 hover:underline flex items-center gap-1">
              <span>View all alerts</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div className="space-y-2.5">
            {criticalAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="p-3 bg-[#080c14] border border-slate-800/80 rounded hover:bg-[#131d33] transition-colors flex items-center justify-between gap-3 font-mono-code"
              >
                <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={alert.severity} size="sm" />
                    <Link href={`/alerts/${alert.id}`} className="text-xs font-bold text-slate-200 hover:text-blue-400 truncate">
                      {alert.title}
                    </Link>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Host: <span className="text-slate-200">{alert.hostname}</span> | Rule:{' '}
                    <span className="text-slate-300">{alert.ruleName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={alert.status} />
                  <Link
                    href={`/alerts/${alert.id}`}
                    className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold transition-colors"
                  >
                    Investigate
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Affected Assets */}
        <div className="bg-[#0f172a] border border-slate-800/80 rounded p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Server size={16} className="text-blue-400" />
              <h2 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-200">
                Asset Risk Register
              </h2>
            </div>
            <Link href="/assets" className="text-xs font-mono-code text-blue-400 hover:underline flex items-center gap-1">
              <span>Inventory</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div className="space-y-2.5">
            {topRiskyAssets.map((asset) => (
              <Link
                key={asset.id}
                href={`/assets/${asset.id}`}
                className="p-3 bg-[#080c14] border border-slate-800/80 rounded hover:bg-[#131d33] transition-colors block space-y-2 font-mono-code group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400">{asset.hostname}</span>
                  <SeverityBadge severity={asset.health} size="sm" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{asset.role}</span>
                  <span className="text-red-400 font-bold">Risk: {asset.riskScore}/100</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
