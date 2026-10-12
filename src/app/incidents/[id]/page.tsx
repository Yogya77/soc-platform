'use client';

import React, { useEffect, useState, use } from 'react';
import { useSecurity } from '@/context/SecurityContext';
import { Incident, IncidentStatus } from '@/types/security';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate, cn } from '@/lib/utils';
import {
  ArrowLeft,
  GitCommit,
  ShieldAlert,
  Cpu,
  FileText,
  User,
  Server,
  Fingerprint,
  MessageSquare,
  Plus,
  Activity,
  Check,
  WifiOff,
  Wifi,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const {
    incidents,
    alerts,
    assets,
    threatIntel,
    auditLogs,
    updateIncidentStatus,
    updateIncidentSeverity,
    assignAnalyst,
    addIncidentNote,
    generateReport,
    isolateAsset,
  } = useSecurity();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [newNote, setNewNote] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'TIMELINE' | 'ALERTS' | 'ASSETS' | 'IOCS' | 'NOTES' | 'AUDIT'>('TIMELINE');

  useEffect(() => {
    const found = incidents.find((i) => i.id === resolvedParams.id);
    if (found) {
      setIncident(found);
    }
  }, [incidents, resolvedParams.id]);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleStatusChange = async (newStatus: IncidentStatus) => {
    if (!incident) return;
    await updateIncidentStatus(incident.id, newStatus);
    showFeedback(`Incident status updated to ${newStatus}.`);
  };

  const handleSeverityChange = async (newSev: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') => {
    if (!incident) return;
    await updateIncidentSeverity(incident.id, newSev);
    showFeedback(`Incident severity changed to ${newSev}.`);
  };

  const handleAssignChange = async (analyst: string) => {
    if (!incident) return;
    await assignAnalyst(incident.id, analyst);
    showFeedback(`Assigned incident to ${analyst}.`);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident || !newNote.trim()) return;
    await addIncidentNote(incident.id, 'Sarah Jenkins (Lead IR)', newNote.trim());
    setNewNote('');
    showFeedback('Investigation note logged.');
  };

  const handleGenerateReport = async () => {
    if (!incident) return;
    await generateReport(incident.id);
    showFeedback('Investigation report generated.');
    setTimeout(() => router.push('/reports'), 800);
  };

  if (!incident) {
    return (
      <div className="p-8 text-center text-xs font-mono-code text-slate-400">
        Incident {resolvedParams.id} not found.{' '}
        <Link href="/incidents" className="text-blue-400 underline">
          Back to Incidents
        </Link>
      </div>
    );
  }

  const linkedAlerts = alerts.filter((a) => incident.alertIds.includes(a.id));
  const linkedAssets = assets.filter((ast) => incident.affectedAssetIds.includes(ast.id));
  const linkedIocs = threatIntel.filter((i) => i.associatedIncidentIds.includes(incident.id));
  const incidentLogs = auditLogs.filter((l) => l.targetId === incident.id || incident.alertIds.includes(l.targetId));

  return (
    <div className="space-y-5">
      {/* Back and Action Banner */}
      <div className="flex items-center justify-between">
        <Link href="/incidents" className="inline-flex items-center gap-1.5 text-xs font-mono-code text-slate-400 hover:text-slate-200">
          <ArrowLeft size={14} />
          <span>Back to Incidents Command List</span>
        </Link>
        {feedback && (
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono-code animate-in fade-in">
            <Check size={14} />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* Incident Command Workspace Header */}
      <div className="bg-[#0f172a] border border-slate-800/80 rounded p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <SeverityBadge severity={incident.severity} size="md" />
              <h1 className="text-base font-mono-code font-bold text-slate-100">{incident.title}</h1>
            </div>
            <div className="text-xs font-mono-code text-slate-400">
              Incident ID: <span className="text-slate-200 font-bold">{incident.id}</span> | Created:{' '}
              <span className="text-slate-300">{formatDate(incident.createdAt)}</span> | Last Updated:{' '}
              <span className="text-slate-300">{formatDate(incident.updatedAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/ai-analyst"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-mono-code font-semibold transition-colors"
            >
              <Cpu size={14} />
              <span>Run AI Investigation</span>
            </Link>
            <button
              onClick={handleGenerateReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-mono-code font-semibold transition-colors"
            >
              <FileText size={14} />
              <span>Generate Report</span>
            </button>
            <StatusBadge status={incident.status} />
          </div>
        </div>

        {/* Operational Controls Toolbar */}
        <div className="p-3 bg-[#080c14] border border-slate-800 rounded grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono-code">
          {/* Status Select */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="text-slate-500">Status:</span>
            <select
              value={incident.status}
              onChange={(e) => handleStatusChange(e.target.value as IncidentStatus)}
              className="bg-[#0f172a] border border-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs font-mono-code focus:outline-none focus:border-blue-500"
            >
              <option value="OPEN">OPEN</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="CONTAINED">CONTAINED</option>
              <option value="ERADICATED">ERADICATED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>

          {/* Severity Select */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="text-slate-500">Severity:</span>
            <select
              value={incident.severity}
              onChange={(e) => handleSeverityChange(e.target.value as any)}
              className="bg-[#0f172a] border border-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs font-mono-code focus:outline-none focus:border-blue-500"
            >
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          {/* Assign Analyst */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="text-slate-500">Analyst:</span>
            <select
              value={incident.assignedAnalyst}
              onChange={(e) => handleAssignChange(e.target.value)}
              className="bg-[#0f172a] border border-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs font-mono-code focus:outline-none focus:border-blue-500 truncate"
            >
              <option value="Sarah Jenkins (Lead IR)">Sarah Jenkins (Lead IR)</option>
              <option value="Marcus Vance (Tier 2 SOC)">Marcus Vance (Tier 2 SOC)</option>
              <option value="Triage Analyst">Triage Analyst</option>
            </select>
          </div>
        </div>

        {/* Risk & Root Cause Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono-code">
          <div className="p-3 bg-[#080c14] rounded border border-slate-800">
            <span className="text-slate-500">Calculated Risk Score:</span>
            <div className="text-red-400 font-bold text-lg mt-0.5">{incident.riskScore}/100</div>
          </div>
          <div className="p-3 bg-[#080c14] rounded border border-slate-800">
            <span className="text-slate-500">Affected Endpoints:</span>
            <div className="text-slate-200 font-bold mt-0.5">{linkedAssets.map((a) => a.hostname).join(', ')}</div>
          </div>
          <div className="p-3 bg-[#080c14] rounded border border-slate-800">
            <span className="text-slate-500">Correlated Alerts:</span>
            <div className="text-orange-400 font-bold mt-0.5">{incident.alertIds.length} Linked Alerts</div>
          </div>
          <div className="p-3 bg-[#080c14] rounded border border-slate-800">
            <span className="text-slate-500">MITRE Tactics:</span>
            <div className="text-blue-400 font-bold mt-0.5">{incident.mitreTactics.join(' • ')}</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-2 text-xs font-mono-code overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-slate-700">
          {[
            { id: 'TIMELINE', label: `Timeline (${incident.timeline.length})`, icon: GitCommit },
            { id: 'ALERTS', label: `Correlated Alerts (${linkedAlerts.length})`, icon: ShieldAlert },
            { id: 'ASSETS', label: `Affected Hosts (${linkedAssets.length})`, icon: Server },
            { id: 'IOCS', label: `Threat IOCs (${linkedIocs.length})`, icon: Fingerprint },
            { id: 'NOTES', label: `Analyst Notes (${incident.notes?.length || 0})`, icon: MessageSquare },
            { id: 'AUDIT', label: `Audit Trail (${incidentLogs.length})`, icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 border-b-2 font-bold transition-colors shrink-0',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                )}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Interactive Pipeline Timeline */}
        {activeTab === 'TIMELINE' && (
          <div className="p-4 bg-[#080c14] rounded border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-200">
                Security Pipeline Timeline (Event → Detection → Alert → Incident → AI)
              </h3>
              <span className="text-[10px] font-mono-code text-slate-500">{incident.timeline.length} correlated stages</span>
            </div>

            <div className="space-y-3 pl-2">
              {incident.timeline.map((item) => (
                <div key={item.id} className="relative pl-6 border-l border-slate-800 pb-2 last:border-l-0">
                  <span className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center" />
                  <div className="flex items-baseline justify-between text-xs font-mono-code">
                    <span className="font-bold text-slate-200">{item.title}</span>
                    <span className="text-slate-500 text-[11px]">{formatDate(item.timestamp)}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-sans leading-relaxed">{item.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      Source: {item.sourceType}
                    </span>
                    {item.referenceId && (
                      <span className="text-[10px] font-mono-code text-blue-400">
                        Ref: {item.referenceId}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Correlated Alerts */}
        {activeTab === 'ALERTS' && (
          <div className="space-y-3">
            {linkedAlerts.map((alt) => (
              <div
                key={alt.id}
                className="p-3.5 bg-[#080c14] border border-slate-800 rounded flex items-center justify-between gap-3 font-mono-code text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={alt.severity} size="sm" />
                    <Link href={`/alerts/${alt.id}`} className="font-bold text-slate-200 hover:text-blue-400">
                      {alt.title}
                    </Link>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Host: <span className="text-slate-200">{alt.hostname}</span> | Rule: {alt.ruleName}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={alt.status} />
                  <Link
                    href={`/alerts/${alt.id}`}
                    className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold"
                  >
                    View Alert
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Affected Assets */}
        {activeTab === 'ASSETS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {linkedAssets.map((ast) => (
              <div
                key={ast.id}
                className="p-4 bg-[#080c14] border border-slate-800 rounded space-y-3 font-mono-code text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server size={14} className="text-blue-400" />
                    <span className="font-bold text-slate-100 text-sm">{ast.hostname}</span>
                  </div>
                  <SeverityBadge severity={ast.health} size="sm" />
                </div>
                <div className="space-y-1 text-slate-400 text-[11px]">
                  <div>IP: <span className="text-slate-200">{ast.ipAddress}</span></div>
                  <div>OS: <span className="text-slate-200">{ast.operatingSystem}</span></div>
                  <div>Role: <span className="text-slate-200">{ast.role}</span></div>
                  <div>Quarantine State: <span className={ast.isolationStatus === 'ISOLATED' ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{ast.isolationStatus}</span></div>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                  <Link
                    href={`/assets/${ast.id}`}
                    className="flex-1 py-1 text-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Host Card
                  </Link>
                  <button
                    onClick={() => isolateAsset(ast.id, ast.isolationStatus !== 'ISOLATED')}
                    className={`px-3 py-1 rounded font-semibold flex items-center gap-1 ${
                      ast.isolationStatus === 'ISOLATED'
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-600/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {ast.isolationStatus === 'ISOLATED' ? <Wifi size={12} /> : <WifiOff size={12} />}
                    <span>{ast.isolationStatus === 'ISOLATED' ? 'Release' : 'Isolate'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Threat IOCs */}
        {activeTab === 'IOCS' && (
          <div className="space-y-2 font-mono-code text-xs">
            {linkedIocs.map((ioc) => (
              <div
                key={ioc.id}
                className="p-3 bg-[#080c14] border border-slate-800 rounded flex items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-blue-400">{ioc.indicator}</div>
                  <div className="text-[11px] text-slate-400">{ioc.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={ioc.verdict} />
                  <Link
                    href="/threat-intel"
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px]"
                  >
                    Lookup
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: Analyst Notes */}
        {activeTab === 'NOTES' && (
          <div className="space-y-4">
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                aria-label="Log analytical finding, containment decision, or escalation notes"
                placeholder="Log analytical finding, containment decision, or escalation notes..."
                rows={3}
                className="w-full bg-[#080c14] border border-slate-800 rounded p-3 text-xs font-mono-code text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newNote.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-mono-code font-semibold transition-colors"
                >
                  <Plus size={13} />
                  <span>Log Investigation Note</span>
                </button>
              </div>
            </form>

            <div className="space-y-2.5 pt-2">
              {incident.notes?.map((note) => (
                <div
                  key={note.id}
                  className="p-3 bg-[#080c14] border border-slate-800 rounded space-y-1 font-mono-code text-xs"
                >
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span className="font-bold text-slate-300">{note.author}</span>
                    <span>{formatDate(note.timestamp)}</span>
                  </div>
                  <p className="text-slate-200 font-sans leading-relaxed">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 6: Audit Trail */}
        {activeTab === 'AUDIT' && (
          <div className="space-y-2 font-mono-code text-xs">
            {incidentLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 bg-[#080c14] border border-slate-800 rounded flex items-start justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="text-slate-200 font-semibold">{log.details}</div>
                  <div className="text-[10px] text-slate-500">
                    Analyst: {log.analyst} | Action: {log.action}
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0">{formatDate(log.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
