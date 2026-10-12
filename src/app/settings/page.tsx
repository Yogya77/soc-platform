'use client';

import React, { useEffect, useState } from 'react';
import { getSecurityService, getActiveServiceMode, setSecurityServiceMode } from '@/services';
import { SystemHealth } from '@/types/security';
import { useSecurity } from '@/context/SecurityContext';
import { Settings, Database, Activity, Server, Radio, RefreshCw, FileText, Check } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';

export default function SettingsPage() {
  const { auditLogs, refreshAll } = useSecurity();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'MOCK_DEMO' | 'REAL_FASTAPI'>('MOCK_DEMO');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setMode(getActiveServiceMode());
    async function loadHealth() {
      try {
        const service = getSecurityService();
        const data = await service.getSystemHealth();
        setHealth(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadHealth();
  }, []);

  const handleModeChange = (newMode: 'MOCK_DEMO' | 'REAL_FASTAPI') => {
    setSecurityServiceMode(newMode);
    setMode(newMode);
    window.location.reload();
  };

  const handleResetDemo = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('soc_data_mode');
    }
    setFeedback('Simulated attack scenario and telemetry reset to initial baseline.');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="bg-[#0f172a] border border-slate-800/80 rounded p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-blue-400" />
            <h1 className="text-sm font-mono-code font-bold uppercase tracking-wider text-slate-100">
              SOC System Configuration & Pipeline Status
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Collector configuration, database connectivity, audit log review, and runtime service mode toggling.
          </p>
        </div>
        {feedback && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono-code animate-in fade-in">
            <Check size={13} />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* Data Source Mode Selection */}
      <div className="bg-[#0f172a] border border-slate-800/80 rounded p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-200">
            Data Architecture Mode
          </h3>
          <button
            onClick={handleResetDemo}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono-code transition-colors"
          >
            <RefreshCw size={12} />
            <span>Reset Demo Baseline</span>
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Switch dynamically between the simulated in-memory dataset and the live FastAPI + PostgreSQL backend.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => handleModeChange('MOCK_DEMO')}
            className={cn(
              'p-4 rounded border text-left transition-all font-mono-code flex items-start gap-3',
              mode === 'MOCK_DEMO'
                ? 'bg-blue-600/15 border-blue-500/50 text-blue-300'
                : 'bg-[#080c14] border-slate-800 text-slate-400 hover:text-slate-200'
            )}
          >
            <Database size={18} className={mode === 'MOCK_DEMO' ? 'text-blue-400' : 'text-slate-500'} />
            <div>
              <div className="text-xs font-bold">MOCK_DEMO (Correlated Scenario)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Pre-configured MITRE ATT&CK intrusion pipeline with simulated events and AI reasoning.
              </div>
            </div>
          </button>

          <button
            onClick={() => handleModeChange('REAL_FASTAPI')}
            className={cn(
              'p-4 rounded border text-left transition-all font-mono-code flex items-start gap-3',
              mode === 'REAL_FASTAPI'
                ? 'bg-emerald-600/15 border-emerald-500/50 text-emerald-300'
                : 'bg-[#080c14] border-slate-800 text-slate-400 hover:text-slate-200'
            )}
          >
            <Radio size={18} className={mode === 'REAL_FASTAPI' ? 'text-emerald-400' : 'text-slate-500'} />
            <div>
              <div className="text-xs font-bold">REAL_FASTAPI (Live Backend)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Connects to FastAPI REST endpoints backed by PostgreSQL database.
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Backend & Collector Health */}
      {health && (
        <div className="bg-[#0f172a] border border-slate-800/80 rounded p-5 space-y-4">
          <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-200">
            Pipeline Health & Heartbeat Status
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono-code">
            <div className="p-3 bg-[#080c14] rounded border border-slate-800">
              <span className="text-slate-500">API Gateway:</span>
              <div className="text-emerald-400 font-bold mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {health.apiStatus}
              </div>
            </div>
            <div className="p-3 bg-[#080c14] rounded border border-slate-800">
              <span className="text-slate-500">Collector Stream:</span>
              <div className="text-emerald-400 font-bold mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {health.collectorStatus}
              </div>
            </div>
            <div className="p-3 bg-[#080c14] rounded border border-slate-800">
              <span className="text-slate-500">PostgreSQL DB:</span>
              <div className="text-emerald-400 font-bold mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {health.databaseStatus}
              </div>
            </div>
            <div className="p-3 bg-[#080c14] rounded border border-slate-800">
              <span className="text-slate-500">AI Reasoning:</span>
              <div className="text-purple-400 font-bold mt-0.5 truncate">
                {health.aiEngineStatus}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Analyst Audit Trail */}
      <div className="bg-[#0f172a] border border-slate-800/80 rounded p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-blue-400" />
            <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-200">
              Complete Analyst Activity & Security Audit Trail ({auditLogs.length} Records)
            </h3>
          </div>
          <span className="text-[10px] font-mono-code text-slate-500">Immutable forensic session log</span>
        </div>

        <div className="space-y-2 font-mono-code text-xs max-h-72 overflow-y-auto">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-2.5 bg-[#080c14] border border-slate-800 rounded flex items-start justify-between gap-3"
            >
              <div className="space-y-0.5 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-blue-300">
                    {log.action}
                  </span>
                  <span className="text-slate-200 font-semibold">{log.details}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Analyst: <span className="text-slate-300">{log.analyst}</span> | Target: {log.targetType} ({log.targetId})
                </div>
              </div>
              <span className="text-[11px] text-slate-500 shrink-0">{formatDate(log.timestamp)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
