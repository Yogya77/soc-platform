'use client';

import React, { useState } from 'react';
import { useSecurity } from '@/context/SecurityContext';
import { ThreatIndicator } from '@/types/threatIntel';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate, cn } from '@/lib/utils';
import {
  Fingerprint,
  AlertCircle,
  Eye,
  Server,
  ShieldAlert,
  AlertTriangle,
  GitBranch,
  X,
  Binary,
} from 'lucide-react';
import Link from 'next/link';

export default function ThreatIntelPage() {
  const { threatIntel, loading } = useSecurity();
  const [selectedVerdict, setSelectedVerdict] = useState<string>('ALL');
  const [activeIoc, setActiveIoc] = useState<ThreatIndicator | null>(null);

  const filteredIntel = threatIntel.filter((ioc) => {
    return selectedVerdict === 'ALL' || ioc.verdict === selectedVerdict;
  });

  const columns: Column<ThreatIndicator>[] = [
    {
      header: 'Indicator / Value',
      accessorKey: 'indicator',
      sortable: true,
      cell: (item) => (
        <span className="font-bold font-mono-code text-blue-400 select-all">{item.indicator}</span>
      ),
    },
    {
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (item) => (
        <span className="text-[11px] font-mono-code px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
          {item.type}
        </span>
      ),
    },
    {
      header: 'Verdict',
      accessorKey: 'verdict',
      sortable: true,
      cell: (item) => <StatusBadge status={item.verdict} />,
    },
    {
      header: 'Confidence',
      accessorKey: 'confidenceScore',
      sortable: true,
      cell: (item) => (
        <span className="font-mono-code text-emerald-400 font-bold">{item.confidenceScore}%</span>
      ),
    },
    {
      header: 'Source Dataset',
      accessorKey: 'sourceLabel',
      cell: (item) => (
        <span className="text-[11px] font-mono-code text-slate-400">{item.sourceLabel}</span>
      ),
    },
    {
      header: 'Threat Actor / Family',
      cell: (item) => (
        <span className="text-slate-300 font-mono-code text-[11px]">
          {item.malwareFamily || item.threatActor || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Last Seen',
      accessorKey: 'lastSeen',
      sortable: true,
      cell: (item) => <span className="text-slate-400 text-[11px] font-mono-code">{formatDate(item.lastSeen)}</span>,
    },
    {
      header: 'Inspect',
      cell: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveIoc(item);
          }}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[11px] font-mono-code font-bold transition-colors"
        >
          <Eye size={12} />
          <span>Graph</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a] border border-slate-800/80 rounded p-4">
        <div>
          <div className="flex items-center gap-2">
            <Fingerprint size={16} className="text-blue-400" />
            <h1 className="text-sm font-mono-code font-bold uppercase tracking-wider text-slate-100">
              Threat Intelligence (IOC Explorer)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Correlated Indicators of Compromise (IPs, Hashes, Domains, URLs) with MITRE mappings and relationship trees.
          </p>
        </div>
      </div>

      {/* Dataset Notice Banner */}
      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded flex items-start gap-2.5 text-xs text-amber-300 font-mono-code">
        <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-400" />
        <div>
          <span className="font-bold">DATASET NOTICE:</span> All indicators listed below originate from the{' '}
          <span className="underline">Demo Threat Intelligence Dataset</span> and represent simulated threat infrastructure (RFC 5737 documentation subnets).
        </div>
      </div>

      {/* Verdict Filter */}
      <div className="bg-[#0f172a] border border-slate-800/80 rounded p-3 flex items-center gap-2 text-xs font-mono-code">
        <span className="text-slate-500 mr-1">Filter by Verdict:</span>
        {['ALL', 'MALICIOUS (SIMULATED)', 'SUSPICIOUS', 'BENIGN'].map((v) => (
          <button
            key={v}
            onClick={() => setSelectedVerdict(v)}
            className={cn(
              'px-2 py-1 rounded text-[11px] font-bold transition-colors',
              selectedVerdict === v
                ? 'bg-blue-600 text-white'
                : 'bg-[#080c14] text-slate-400 border border-slate-800 hover:text-slate-200'
            )}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Main Table */}
      <DataTable
        data={filteredIntel}
        columns={columns}
        keyExtractor={(item) => item.id}
        selectedId={activeIoc?.id}
        isLoading={loading}
        onRowClick={(item) => setActiveIoc(item)}
        searchPlaceholder="Search indicators, hashes, threat actors, tags..."
        searchFilter={(item, query) => {
          const q = query.toLowerCase();
          return (
            item.indicator.toLowerCase().includes(q) ||
            item.type.toLowerCase().includes(q) ||
            Boolean(item.threatActor && item.threatActor.toLowerCase().includes(q)) ||
            Boolean(item.malwareFamily && item.malwareFamily.toLowerCase().includes(q)) ||
            item.tags.some((t) => t.toLowerCase().includes(q))
          );
        }}
      />

      {/* IOC Investigation Relationship Tree Drawer */}
      {activeIoc && (
        <div className="bg-[#0f172a] border border-slate-700 rounded p-5 space-y-4 shadow-xl animate-in fade-in">
          <div className="flex items-start justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-code px-2 py-0.5 rounded bg-purple-600/20 text-purple-300 font-bold">
                  {activeIoc.type}
                </span>
                <h3 className="text-sm font-mono-code font-bold text-slate-100 select-all">{activeIoc.indicator}</h3>
                <StatusBadge status={activeIoc.verdict} />
              </div>
              <div className="text-xs font-mono-code text-slate-400 mt-1">
                Source: <span className="text-slate-200">{activeIoc.sourceLabel}</span> | Confidence:{' '}
                <span className="text-emerald-400 font-bold">{activeIoc.confidenceScore}%</span>
              </div>
            </div>
            <button
              onClick={() => setActiveIoc(null)}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed">{activeIoc.description}</p>

          {/* Relational Investigation Chain: IOC -> Events -> Alerts -> Incidents */}
          <div className="p-4 bg-[#080c14] rounded border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono-code font-bold uppercase tracking-wider text-purple-400">
              <GitBranch size={14} />
              <span>Correlated Investigation Chain</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono-code">
              {/* 1. IOC Root */}
              <div className="p-2.5 bg-[#0f172a] rounded border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px]">1. Threat IOC</span>
                <div className="font-bold text-slate-200 truncate">{activeIoc.indicator}</div>
                <div className="text-[10px] text-purple-400">{activeIoc.type}</div>
              </div>

              {/* 2. Correlated Events */}
              <div className="p-2.5 bg-[#0f172a] rounded border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px]">2. Associated Events ({activeIoc.associatedEventIds.length})</span>
                {activeIoc.associatedEventIds.length > 0 ? (
                  activeIoc.associatedEventIds.map((eid) => (
                    <Link key={eid} href="/events" className="text-blue-400 hover:underline block truncate">
                      • {eid}
                    </Link>
                  ))
                ) : (
                  <div className="text-slate-500 text-[11px]">No events</div>
                )}
              </div>

              {/* 3. Associated Alerts */}
              <div className="p-2.5 bg-[#0f172a] rounded border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px]">3. Triggered Alerts ({activeIoc.associatedAlertIds.length})</span>
                {activeIoc.associatedAlertIds.length > 0 ? (
                  activeIoc.associatedAlertIds.map((aid) => (
                    <Link key={aid} href={`/alerts/${aid}`} className="text-orange-400 hover:underline block truncate">
                      • {aid}
                    </Link>
                  ))
                ) : (
                  <div className="text-slate-500 text-[11px]">No alerts</div>
                )}
              </div>

              {/* 4. Associated Incident */}
              <div className="p-2.5 bg-[#0f172a] rounded border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px]">4. Active Incident</span>
                {activeIoc.associatedIncidentIds.length > 0 ? (
                  activeIoc.associatedIncidentIds.map((iid) => (
                    <Link key={iid} href={`/incidents/${iid}`} className="text-red-400 font-bold hover:underline block truncate">
                      • {iid}
                    </Link>
                  ))
                ) : (
                  <div className="text-slate-500 text-[11px]">No incident link</div>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono-code">
            <span className="text-slate-500">Tags:</span>
            {activeIoc.tags.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                #{t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
