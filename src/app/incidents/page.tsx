'use client';

import React, { useState } from 'react';
import { useSecurity } from '@/context/SecurityContext';
import { Incident } from '@/types/security';
import { DataTable, Column } from '@/components/common/DataTable';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate, cn } from '@/lib/utils';
import { AlertTriangle, Filter, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function IncidentsPage() {
  const { incidents, loading } = useSecurity();
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const filteredIncidents = incidents.filter((inc) => {
    const matchSev = selectedSeverity === 'ALL' || inc.severity === selectedSeverity;
    const matchStat = selectedStatus === 'ALL' || inc.status === selectedStatus;
    return matchSev && matchStat;
  });

  const columns: Column<Incident>[] = [
    {
      header: 'Severity',
      accessorKey: 'severity',
      sortable: true,
      cell: (item) => <SeverityBadge severity={item.severity} size="sm" />,
    },
    {
      header: 'Incident ID',
      accessorKey: 'id',
      sortable: true,
      cell: (item) => (
        <Link href={`/incidents/${item.id}`} className="text-blue-400 hover:underline font-bold font-mono-code">
          {item.id}
        </Link>
      ),
    },
    {
      header: 'Incident Title',
      accessorKey: 'title',
      sortable: true,
      cell: (item) => (
        <div>
          <span className="font-semibold text-slate-200">{item.title}</span>
          <div className="text-[10px] text-slate-500 font-mono-code">
            Tactics: {item.mitreTactics.join(' • ')}
          </div>
        </div>
      ),
    },
    {
      header: 'Risk Score',
      accessorKey: 'riskScore',
      sortable: true,
      cell: (item) => (
        <span
          className={
            item.riskScore > 80
              ? 'text-red-400 font-bold font-mono-code'
              : item.riskScore > 50
              ? 'text-amber-400 font-bold font-mono-code'
              : 'text-emerald-400 font-bold font-mono-code'
          }
        >
          {item.riskScore}/100
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (item) => <StatusBadge status={item.status} />,
    },
    {
      header: 'Assigned Analyst',
      accessorKey: 'assignedAnalyst',
      sortable: true,
      cell: (item) => <span className="text-slate-300 font-mono-code">{item.assignedAnalyst}</span>,
    },
    {
      header: 'Created At',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (item) => <span className="text-slate-400 text-[11px] font-mono-code">{formatDate(item.createdAt)}</span>,
    },
    {
      header: 'Actions',
      cell: (item) => (
        <Link
          href={`/incidents/${item.id}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold font-mono-code transition-colors"
        >
          <span>Command</span>
          <ArrowRight size={12} />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a] border border-slate-800/80 rounded p-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400" />
            <h1 className="text-sm font-mono-code font-bold uppercase tracking-wider text-slate-100">
              Incident Command Center
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Active multi-stage cybersecurity intrusions and correlated incident response workspaces.
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-[#0f172a] border border-slate-800/80 rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono-code">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500 flex items-center gap-1 mr-1">
            <Filter size={12} />
            <span>Severity:</span>
          </span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={cn(
                'px-2 py-1 rounded text-[11px] font-bold transition-colors',
                selectedSeverity === sev
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#080c14] text-slate-400 border border-slate-800 hover:text-slate-200'
              )}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500 mr-1">Status:</span>
          {['ALL', 'OPEN', 'INVESTIGATING', 'CONTAINED', 'ERADICATED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={cn(
                'px-2 py-1 rounded text-[11px] font-bold transition-colors',
                selectedStatus === st
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#080c14] text-slate-400 border border-slate-800 hover:text-slate-200'
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        data={filteredIncidents}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        searchPlaceholder="Filter incidents by title, ID, analyst..."
        searchFilter={(item, query) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.id.toLowerCase().includes(query.toLowerCase()) ||
          item.assignedAnalyst.toLowerCase().includes(query.toLowerCase())
        }
      />
    </div>
  );
}
