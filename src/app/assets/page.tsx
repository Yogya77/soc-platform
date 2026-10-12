'use client';

import React, { useState } from 'react';
import { useSecurity } from '@/context/SecurityContext';
import { Asset } from '@/types/security';
import { DataTable, Column } from '@/components/common/DataTable';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { formatDate, cn } from '@/lib/utils';
import { Server, WifiOff, Wifi, Filter, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AssetsPage() {
  const { assets, loading, isolateAsset } = useSecurity();
  const [selectedHealth, setSelectedHealth] = useState<string>('ALL');

  const filteredAssets = assets.filter((a) => {
    return selectedHealth === 'ALL' || a.health === selectedHealth;
  });

  const columns: Column<Asset>[] = [
    {
      header: 'Hostname',
      accessorKey: 'hostname',
      sortable: true,
      cell: (item) => (
        <Link href={`/assets/${item.id}`} className="text-blue-400 font-bold font-mono-code hover:underline">
          {item.hostname}
        </Link>
      ),
    },
    {
      header: 'IP Address',
      accessorKey: 'ipAddress',
      sortable: true,
      cell: (item) => <span className="font-mono-code text-slate-300">{item.ipAddress}</span>,
    },
    {
      header: 'OS Platform',
      accessorKey: 'operatingSystem',
      sortable: true,
      cell: (item) => <span className="text-slate-300 font-mono-code text-[11px] truncate max-w-xs block">{item.operatingSystem}</span>,
    },
    {
      header: 'Role',
      accessorKey: 'role',
      sortable: true,
      cell: (item) => <span className="text-slate-400 font-mono-code">{item.role}</span>,
    },
    {
      header: 'Health State',
      accessorKey: 'health',
      sortable: true,
      cell: (item) => <SeverityBadge severity={item.health} size="sm" />,
    },
    {
      header: 'Risk Score',
      accessorKey: 'riskScore',
      sortable: true,
      cell: (item) => (
        <span
          className={
            item.riskScore > 75
              ? 'text-red-400 font-bold font-mono-code'
              : item.riskScore > 40
              ? 'text-amber-400 font-bold font-mono-code'
              : 'text-emerald-400 font-bold font-mono-code'
          }
        >
          {item.riskScore}/100
        </span>
      ),
    },
    {
      header: 'Open Alerts',
      accessorKey: 'openAlertCount',
      sortable: true,
      cell: (item) => (
        <span className="font-bold font-mono-code text-slate-200">{item.openAlertCount}</span>
      ),
    },
    {
      header: 'Isolation',
      accessorKey: 'isolationStatus',
      sortable: true,
      cell: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            isolateAsset(item.id, item.isolationStatus !== 'ISOLATED');
          }}
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono-code transition-colors border',
            item.isolationStatus === 'ISOLATED'
              ? 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          )}
          title="Click to toggle network quarantine"
        >
          {item.isolationStatus === 'ISOLATED' ? <WifiOff size={11} /> : <Wifi size={11} />}
          <span>{item.isolationStatus}</span>
        </button>
      ),
    },
    {
      header: 'Actions',
      cell: (item) => (
        <Link
          href={`/assets/${item.id}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[11px] font-bold font-mono-code transition-colors"
        >
          <span>Profile</span>
          <ArrowRight size={11} />
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
            <Server size={16} className="text-blue-400" />
            <h1 className="text-sm font-mono-code font-bold uppercase tracking-wider text-slate-100">
              Asset Inventory & Host Risk Register
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise endpoint telemetry, host health states, and risk prioritization with live quarantine capabilities.
          </p>
        </div>
      </div>

      {/* Filter by Health */}
      <div className="bg-[#0f172a] border border-slate-800/80 rounded p-3 flex items-center gap-2 text-xs font-mono-code">
        <span className="text-slate-500 mr-1 flex items-center gap-1">
          <Filter size={12} />
          <span>Filter Health:</span>
        </span>
        {['ALL', 'CRITICAL', 'WARNING', 'HEALTHY'].map((h) => (
          <button
            key={h}
            onClick={() => setSelectedHealth(h)}
            className={cn(
              'px-2 py-1 rounded text-[11px] font-bold transition-colors',
              selectedHealth === h
                ? 'bg-blue-600 text-white'
                : 'bg-[#080c14] text-slate-400 border border-slate-800 hover:text-slate-200'
            )}
          >
            {h}
          </button>
        ))}
      </div>

      <DataTable
        data={filteredAssets}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        searchPlaceholder="Search hostname, IP, role, OS..."
        searchFilter={(item, query) =>
          item.hostname.toLowerCase().includes(query.toLowerCase()) ||
          item.ipAddress.toLowerCase().includes(query.toLowerCase()) ||
          item.operatingSystem.toLowerCase().includes(query.toLowerCase()) ||
          item.role.toLowerCase().includes(query.toLowerCase())
        }
      />
    </div>
  );
}
