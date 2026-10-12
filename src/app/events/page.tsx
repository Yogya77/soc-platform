'use client';

import React, { useState } from 'react';
import { useSecurity } from '@/context/SecurityContext';
import { WindowsSecurityEvent } from '@/types/events';
import { DataTable, Column } from '@/components/common/DataTable';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { JsonViewer } from '@/components/common/JsonViewer';
import { formatDate, cn } from '@/lib/utils';
import { Binary, Eye, Filter, ArrowRight, Server, ShieldAlert, AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';

export default function EventsPage() {
  const { events, loading } = useSecurity();
  const [selectedEventIdFilter, setSelectedEventIdFilter] = useState<number | 'ALL'>('ALL');
  const [selectedHostFilter, setSelectedHostFilter] = useState<string>('ALL');
  const [activeEvent, setActiveEvent] = useState<WindowsSecurityEvent | null>(null);

  const filteredEvents = events.filter((e) => {
    const matchId = selectedEventIdFilter === 'ALL' || e.eventId === selectedEventIdFilter;
    const matchHost = selectedHostFilter === 'ALL' || e.hostname === selectedHostFilter;
    return matchId && matchHost;
  });

  const columns: Column<WindowsSecurityEvent>[] = [
    {
      header: 'Event ID',
      accessorKey: 'eventId',
      sortable: true,
      cell: (item) => (
        <span className="font-bold text-blue-400 font-mono-code">{item.eventId}</span>
      ),
    },
    {
      header: 'Event Description',
      accessorKey: 'eventName',
      sortable: true,
      cell: (item) => (
        <div>
          <span className="font-semibold text-slate-200">{item.eventName}</span>
          {item.detectionRelevance && (
            <div className="text-[10px] text-yellow-400/90 font-mono-code truncate max-w-sm">
              {item.detectionRelevance}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Host',
      accessorKey: 'hostname',
      sortable: true,
      cell: (item) => (
        <span className="text-slate-300 font-mono-code">{item.hostname}</span>
      ),
    },
    {
      header: 'Account',
      accessorKey: 'username',
      sortable: true,
      cell: (item) => <span className="text-slate-300 font-mono-code">{item.username}</span>,
    },
    {
      header: 'Process / Target',
      cell: (item) => (
        <span className="text-slate-400 font-mono-code text-[11px] truncate max-w-xs block">
          {item.processCommandLine || item.processName || item.sourceIp || '-'}
        </span>
      ),
    },
    {
      header: 'Timestamp',
      accessorKey: 'timestamp',
      sortable: true,
      cell: (item) => <span className="text-slate-400 text-[11px] font-mono-code">{formatDate(item.timestamp)}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (item) => <StatusBadge status={item.status} />,
    },
    {
      header: 'Inspect',
      cell: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveEvent(item);
          }}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[11px] font-mono-code font-bold transition-colors"
        >
          <Eye size={12} />
          <span>Inspect</span>
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
            <Binary size={16} className="text-blue-400" />
            <h1 className="text-sm font-mono-code font-bold uppercase tracking-wider text-slate-100">
              Windows Security Event Telemetry
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Windows Event logs (4624 Logon, 4625 Failed Logon, 4688 Process Creation, 7045 Service Install, 1102 Audit Log Cleared).
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-[#0f172a] border border-slate-800/80 rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono-code">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500 flex items-center gap-1 mr-1">
            <Filter size={12} />
            <span>Event ID:</span>
          </span>
          {[
            { label: 'ALL', id: 'ALL' },
            { label: '4624 (Logon)', id: 4624 },
            { label: '4625 (Failed Logon)', id: 4625 },
            { label: '4688 (Process)', id: 4688 },
            { label: '7045 (Service)', id: 7045 },
            { label: '4672 (Admin Priv)', id: 4672 },
            { label: '1102 (Log Cleared)', id: 1102 },
          ].map((f) => (
            <button
              key={f.label}
              onClick={() => setSelectedEventIdFilter(f.id as any)}
              className={cn(
                'px-2 py-1 rounded text-[11px] font-bold transition-colors',
                selectedEventIdFilter === f.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#080c14] text-slate-400 border border-slate-800 hover:text-slate-200'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">Host:</span>
          {['ALL', 'DC-CORP-01', 'WKS-FIN-04'].map((h) => (
            <button
              key={h}
              onClick={() => setSelectedHostFilter(h)}
              className={cn(
                'px-2 py-1 rounded text-[11px] font-bold transition-colors',
                selectedHostFilter === h
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#080c14] text-slate-400 border border-slate-800 hover:text-slate-200'
              )}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        data={filteredEvents}
        columns={columns}
        keyExtractor={(item) => item.id}
        selectedId={activeEvent?.id}
        isLoading={loading}
        onRowClick={(item) => setActiveEvent(item)}
        searchPlaceholder="Search event ID, description, host, account, process..."
        searchFilter={(item, query) =>
          item.eventName.toLowerCase().includes(query.toLowerCase()) ||
          item.eventId.toString().includes(query) ||
          item.hostname.toLowerCase().includes(query.toLowerCase()) ||
          item.username.toLowerCase().includes(query.toLowerCase()) ||
          Boolean(item.processCommandLine && item.processCommandLine.toLowerCase().includes(query.toLowerCase())) ||
          Boolean(item.sourceIp && item.sourceIp.toLowerCase().includes(query.toLowerCase()))
        }
      />

      {/* Event Detail Inspector Drawer / Modal */}
      {activeEvent && (
        <div className="bg-[#0f172a] border border-slate-700 rounded p-5 space-y-4 shadow-xl animate-in fade-in">
          <div className="flex items-start justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-code px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 font-bold">
                  Event ID {activeEvent.eventId}
                </span>
                <h3 className="text-sm font-mono-code font-bold text-slate-100">{activeEvent.eventName}</h3>
              </div>
              <div className="text-xs font-mono-code text-slate-400 mt-1">
                Log ID: <span className="text-slate-200 font-bold">{activeEvent.id}</span> | Host:{' '}
                <span className="text-slate-200 font-bold">{activeEvent.hostname}</span> | User:{' '}
                <span className="text-slate-200 font-bold">{activeEvent.username}</span> | Timestamp:{' '}
                <span className="text-slate-300">{formatDate(activeEvent.timestamp)}</span>
              </div>
            </div>
            <button
              onClick={() => setActiveEvent(null)}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X size={16} />
            </button>
          </div>

          {/* Context & Relational Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono-code text-xs">
            <div className="p-3 bg-[#080c14] border border-slate-800 rounded space-y-1">
              <span className="text-slate-500">Detection Relevance:</span>
              <p className="text-yellow-400/90 font-sans text-xs">{activeEvent.detectionRelevance || 'Standard operational security audit log entry.'}</p>
            </div>

            <div className="p-3 bg-[#080c14] border border-slate-800 rounded space-y-1">
              <span className="text-slate-500">Related Alert:</span>
              {activeEvent.relatedAlertId ? (
                <div>
                  <Link href={`/alerts/${activeEvent.relatedAlertId}`} className="text-blue-400 font-bold hover:underline flex items-center gap-1">
                    <ShieldAlert size={12} />
                    <span>{activeEvent.relatedAlertId}</span>
                  </Link>
                </div>
              ) : (
                <div className="text-slate-500">No direct single alert</div>
              )}
            </div>

            <div className="p-3 bg-[#080c14] border border-slate-800 rounded space-y-1">
              <span className="text-slate-500">Related Incident:</span>
              {activeEvent.relatedIncidentId ? (
                <div>
                  <Link href={`/incidents/${activeEvent.relatedIncidentId}`} className="text-red-400 font-bold hover:underline flex items-center gap-1">
                    <AlertTriangle size={12} />
                    <span>{activeEvent.relatedIncidentId}</span>
                  </Link>
                </div>
              ) : (
                <div className="text-slate-500">No incident correlation</div>
              )}
            </div>
          </div>

          {/* Formatted Syntax-readable Raw JSON */}
          <JsonViewer
            title={`Raw Event Payload (EventID: ${activeEvent.eventId} on ${activeEvent.hostname})`}
            data={activeEvent.rawXmlOrJson}
          />
        </div>
      )}
    </div>
  );
}
