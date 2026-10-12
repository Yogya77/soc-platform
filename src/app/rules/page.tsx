'use client';

import React, { useState } from 'react';
import { useSecurity } from '@/context/SecurityContext';
import { DetectionRule } from '@/types/rules';
import { DataTable, Column } from '@/components/common/DataTable';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate, cn } from '@/lib/utils';
import {
  Sliders,
  ToggleLeft,
  ToggleRight,
  Play,
  FileCode,
  ShieldAlert,
  X,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import Link from 'next/link';

export default function RulesPage() {
  const { rules, loading, toggleRule, testRule } = useSecurity();
  const [activeRule, setActiveRule] = useState<DetectionRule | null>(null);
  const [testResult, setTestResult] = useState<{ matched: boolean; sampleEvent: string; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTestRule = async (ruleId: string) => {
    setIsTesting(true);
    try {
      const res = await testRule(ruleId);
      setTestResult(res);
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopyYaml = (yaml?: string) => {
    if (!yaml) return;
    navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const columns: Column<DetectionRule>[] = [
    {
      header: 'Severity',
      accessorKey: 'severity',
      sortable: true,
      cell: (item) => <SeverityBadge severity={item.severity} size="sm" />,
    },
    {
      header: 'Rule ID',
      accessorKey: 'id',
      sortable: true,
      cell: (item) => <span className="font-bold text-blue-400 font-mono-code">{item.id}</span>,
    },
    {
      header: 'Rule Name',
      accessorKey: 'name',
      sortable: true,
      cell: (item) => (
        <div>
          <div className="font-semibold text-slate-200">{item.name}</div>
          <div className="text-[11px] text-slate-500 font-mono-code">{item.mitreTechniqueId} - {item.mitreTechniqueName}</div>
        </div>
      ),
    },
    {
      header: 'MITRE Tactic',
      accessorKey: 'mitreTactic',
      sortable: true,
      cell: (item) => <span className="text-slate-300 font-mono-code">{item.mitreTactic}</span>,
    },
    {
      header: 'Trigger Count',
      accessorKey: 'triggerCount',
      sortable: true,
      cell: (item) => (
        <span className="font-bold font-mono-code text-slate-200">{item.triggerCount}</span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleRule(item.id, item.status !== 'ACTIVE');
          }}
          className="flex items-center gap-1.5"
          title="Click to toggle rule"
        >
          {item.status === 'ACTIVE' ? (
            <ToggleRight size={18} className="text-emerald-400" />
          ) : (
            <ToggleLeft size={18} className="text-slate-600" />
          )}
          <StatusBadge status={item.status} />
        </button>
      ),
    },
    {
      header: 'Actions',
      cell: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveRule(item);
            setTestResult(null);
          }}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[11px] font-bold font-mono-code transition-colors"
        >
          <FileCode size={12} />
          <span>Sigma</span>
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
            <Sliders size={16} className="text-blue-400" />
            <h1 className="text-sm font-mono-code font-bold uppercase tracking-wider text-slate-100">
              SIEM & Sigma Detection Rules Catalog
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Correlation rule definitions, Sigma query logic, test simulator, and MITRE ATT&CK coverage.
          </p>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        data={rules}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        onRowClick={(item) => {
          setActiveRule(item);
          setTestResult(null);
        }}
        searchPlaceholder="Search rule name, ID, tactic, technique..."
        searchFilter={(item, query) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.id.toLowerCase().includes(query.toLowerCase()) ||
          item.mitreTactic.toLowerCase().includes(query.toLowerCase()) ||
          item.mitreTechniqueId.toLowerCase().includes(query.toLowerCase())
        }
      />

      {/* Rule Detail & Sigma YAML Inspector Drawer */}
      {activeRule && (
        <div className="bg-[#0f172a] border border-slate-700 rounded p-5 space-y-4 shadow-xl animate-in fade-in">
          <div className="flex items-start justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <SeverityBadge severity={activeRule.severity} size="sm" />
                <h3 className="text-sm font-mono-code font-bold text-slate-100">{activeRule.name}</h3>
                <StatusBadge status={activeRule.status} />
              </div>
              <div className="text-xs font-mono-code text-slate-400 mt-1">
                Rule ID: <span className="text-slate-200 font-bold">{activeRule.id}</span> | Technique:{' '}
                <span className="text-blue-400 font-bold">{activeRule.mitreTechniqueId} - {activeRule.mitreTechniqueName}</span> | Author:{' '}
                <span className="text-slate-300">{activeRule.author}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveRule(null);
                setTestResult(null);
              }}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed">{activeRule.description}</p>

          {/* Query Logic & Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#080c14] border border-slate-800 rounded">
            <div className="text-xs font-mono-code text-yellow-400/90 font-semibold truncate max-w-xl">
              Logic: {activeRule.queryLogic}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTestRule(activeRule.id)}
                disabled={isTesting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-mono-code font-semibold transition-colors"
              >
                <Play size={12} />
                <span>{isTesting ? 'Testing Rule...' : 'Test Rule on Telemetry'}</span>
              </button>
              <Link
                href="/alerts"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono-code font-semibold transition-colors"
              >
                <ShieldAlert size={12} />
                <span>View Triggered Alerts</span>
              </Link>
            </div>
          </div>

          {/* Test Rule Simulation Result Banner */}
          {testResult && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded space-y-1 font-mono-code text-xs text-emerald-300 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>{testResult.message}</span>
              </div>
              <div className="text-[11px] text-slate-300 pl-5">
                Sample Matching Telemetry: <span className="text-emerald-400">{testResult.sampleEvent}</span>
              </div>
            </div>
          )}

          {/* Formatted Sigma YAML Rule Block */}
          {activeRule.sigmaYaml && (
            <div className="bg-[#080c14] rounded border border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-[#131d33] border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileCode size={14} className="text-yellow-400" />
                  <span className="text-xs font-mono-code font-semibold text-slate-300">
                    Sigma Rule Specification (YAML)
                  </span>
                </div>
                <button
                  onClick={() => handleCopyYaml(activeRule.sigmaYaml)}
                  className="flex items-center gap-1 text-[11px] font-mono-code text-slate-400 hover:text-slate-200"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy Sigma YAML'}</span>
                </button>
              </div>
              <pre className="p-3 text-[11px] font-mono-code text-yellow-300/90 overflow-x-auto max-h-64 leading-relaxed scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                <code>{activeRule.sigmaYaml}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
