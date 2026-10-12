'use client';

import React, { useEffect, useState, use } from 'react';
import { useSecurity } from '@/context/SecurityContext';
import { Alert, CreateIncidentPayload } from '@/types/security';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { JsonViewer } from '@/components/common/JsonViewer';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { CreateIncidentModal } from '@/components/common/CreateIncidentModal';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  ShieldAlert,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Link as LinkIcon,
  Server,
  Fingerprint,
  FileCode,
  Check,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { alerts, updateAlertStatus, escalateAlert, linkAlertToIncident, incidents } = useSecurity();
  const [alert, setAlert] = useState<Alert | null>(null);

  // Modal states
  const [isCreateIncidentModalOpen, setIsCreateIncidentModalOpen] = useState(false);
  const [isDismissModalOpen, setIsDismissModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const found = alerts.find((a) => a.id === resolvedParams.id);
    if (found) {
      setAlert(found);
    }
  }, [alerts, resolvedParams.id]);

  const showFeedback = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleAcknowledge = async () => {
    if (!alert) return;
    await updateAlertStatus(alert.id, 'INVESTIGATING', 'Analyst acknowledged and initiated triage.');
    showFeedback('Alert status updated to INVESTIGATING.');
  };

  const handleResolve = async () => {
    if (!alert) return;
    await updateAlertStatus(alert.id, 'RESOLVED', 'Analyst resolved the detection.');
    showFeedback('Alert resolved successfully.');
  };

  const handleConfirmDismiss = async () => {
    if (!alert) return;
    await updateAlertStatus(alert.id, 'DISMISSED', 'Marked as false positive / benign activity.');
    showFeedback('Alert dismissed as false positive.');
  };

  const handleCreateIncidentSubmit = async (payload: CreateIncidentPayload) => {
    if (!alert) return;
    const newInc = await escalateAlert(alert.id, payload);
    setIsCreateIncidentModalOpen(false);
    showFeedback(`Incident ${newInc.id} created successfully from alert ${alert.id}.`);
    setTimeout(() => router.push(`/incidents/${newInc.id}`), 800);
  };

  const handleConfirmLink = async () => {
    if (!alert) return;
    await linkAlertToIncident(alert.id, 'INC-2026-0421');
    setIsLinkModalOpen(false);
    showFeedback(`Alert linked to Incident INC-2026-0421.`);
  };

  if (!alert) {
    return (
      <div className="p-8 text-center text-xs font-mono-code text-slate-400">
        Alert {resolvedParams.id} not found.{' '}
        <Link href="/alerts" className="text-blue-400 underline">
          Back to Alerts
        </Link>
      </div>
    );
  }

  // Find linked incident if one exists
  const linkedIncident = incidents.find(
    (i) => (alert.incidentId && i.id === alert.incidentId) || i.alertIds.includes(alert.id)
  );

  return (
    <div className="space-y-5">
      {/* Back button & Action Feedback Banner */}
      <div className="flex items-center justify-between">
        <Link href="/alerts" className="inline-flex items-center gap-1.5 text-xs font-mono-code text-slate-400 hover:text-slate-200">
          <ArrowLeft size={14} />
          <span>Back to Alerts Queue</span>
        </Link>
        {actionSuccessMsg && (
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono-code animate-in fade-in">
            <Check size={14} />
            <span>{actionSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Main Alert Investigation Header */}
      <div className="bg-[#0f172a] border border-slate-800/80 rounded p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <SeverityBadge severity={alert.severity} size="md" />
              <h1 className="text-base font-mono-code font-bold text-slate-100">{alert.title}</h1>
            </div>
            <div className="text-xs font-mono-code text-slate-400">
              Alert ID: <span className="text-slate-200 font-bold">{alert.id}</span> | Detected:{' '}
              <span className="text-slate-200">{formatDate(alert.detectedAt)}</span> | Confidence:{' '}
              <span className="text-emerald-400 font-bold">{alert.confidenceScore}%</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={alert.status} />
          </div>
        </div>

        {/* Analyst Actions Toolbar */}
        <div className="p-3 bg-[#080c14] border border-slate-800 rounded flex flex-wrap items-center justify-between gap-2.5">
          <div className="text-xs font-mono-code text-slate-400 font-bold uppercase tracking-wider">
            Analyst Actions:
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {alert.status === 'NEW' && (
              <button
                onClick={handleAcknowledge}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-mono-code font-semibold transition-colors"
              >
                <CheckCircle2 size={13} />
                <span>Acknowledge</span>
              </button>
            )}

            <Link
              href="/ai-analyst"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-mono-code font-semibold transition-colors"
            >
              <Cpu size={13} />
              <span>Investigate with AI</span>
            </Link>

            {/* If alert already belongs to an incident, provide prominent View Incident and secondary Create New Incident */}
            {linkedIncident ? (
              <>
                <Link
                  href={`/incidents/${linkedIncident.id}`}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-red-600/20 hover:bg-red-600/35 text-red-300 border border-red-500/40 text-xs font-mono-code font-bold transition-all shadow-sm"
                >
                  <AlertTriangle size={13} className="text-red-400" />
                  <span>View Linked Incident ({linkedIncident.id})</span>
                  <ExternalLink size={11} className="text-red-400" />
                </Link>

                <button
                  onClick={() => setIsCreateIncidentModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/30 text-xs font-mono-code font-semibold transition-colors"
                >
                  <AlertTriangle size={13} />
                  <span>Create Incident</span>
                </button>
              </>
            ) : (
              /* If alert is unlinked, show primary Create Incident and Link to Incident */
              <>
                <button
                  onClick={() => setIsCreateIncidentModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-orange-600/20 hover:bg-orange-600/35 text-orange-300 border border-orange-500/40 text-xs font-mono-code font-bold transition-all shadow-sm"
                >
                  <AlertTriangle size={13} className="text-orange-400" />
                  <span>Create Incident</span>
                </button>

                <button
                  onClick={() => setIsLinkModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono-code transition-colors"
                >
                  <LinkIcon size={13} />
                  <span>Link to Incident INC-2026-0421</span>
                </button>
              </>
            )}

            {alert.status !== 'DISMISSED' && (
              <button
                onClick={() => setIsDismissModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800/60 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-700 text-xs font-mono-code transition-colors"
              >
                <XCircle size={13} />
                <span>Mark False Positive</span>
              </button>
            )}

            {alert.status !== 'RESOLVED' && alert.status !== 'DISMISSED' && (
              <button
                onClick={handleResolve}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-mono-code font-semibold transition-colors"
              >
                <CheckCircle2 size={13} />
                <span>Resolve Alert</span>
              </button>
            )}
          </div>
        </div>

        {/* Relational Context Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono-code">
          {/* Affected Host */}
          <div className="p-3 bg-[#080c14] rounded border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1">
                <Server size={12} />
                <span>Affected Host</span>
              </span>
              <Link href={`/assets/${alert.assetId}`} className="text-blue-400 hover:underline">
                View Asset
              </Link>
            </div>
            <div className="text-slate-100 font-bold text-sm">{alert.hostname}</div>
            <div className="text-[11px] text-slate-400">
              User: <span className="text-slate-300">{alert.username || 'System Session'}</span>
            </div>
          </div>

          {/* Triggered Rule */}
          <div className="p-3 bg-[#080c14] rounded border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1">
                <FileCode size={12} />
                <span>Detection Rule</span>
              </span>
              <Link href="/rules" className="text-blue-400 hover:underline">
                View Rule
              </Link>
            </div>
            <div className="text-slate-100 font-bold text-sm truncate">{alert.ruleName}</div>
            <div className="text-[11px] text-slate-400">
              Rule ID: <span className="text-slate-300">{alert.ruleId}</span>
            </div>
          </div>

          {/* MITRE ATT&CK Mapping */}
          <div className="p-3 bg-[#080c14] rounded border border-slate-800 space-y-1">
            <div className="text-slate-500">MITRE ATT&CK Technique</div>
            <div className="text-blue-400 font-bold text-sm">
              {alert.mitreTechniqueId ? `${alert.mitreTechniqueId}` : 'T1059.001'}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {alert.mitreTechniqueName || 'PowerShell'} ({alert.mitreTactic || 'Execution'})
            </div>
          </div>

          {/* Correlated Incident Status */}
          <div className="p-3 bg-[#080c14] rounded border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1">
                <AlertTriangle size={12} />
                <span>Correlated Incident</span>
              </span>
              {linkedIncident && (
                <Link href={`/incidents/${linkedIncident.id}`} className="text-red-400 hover:underline">
                  Command Hub
                </Link>
              )}
            </div>
            {linkedIncident ? (
              <>
                <div className="text-red-400 font-bold text-sm">{linkedIncident.id}</div>
                <div className="text-[11px] text-slate-300 truncate">{linkedIncident.title}</div>
              </>
            ) : (
              <>
                <div className="text-slate-400 font-semibold text-sm">Unassigned</div>
                <div className="text-[11px] text-slate-500">Click &quot;Create Incident&quot; to escalate</div>
              </>
            )}
          </div>
        </div>

        {/* Why Triggered & Evidence Context */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 bg-[#080c14] rounded border border-slate-800 space-y-2">
            <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-200">
              Why the Alert Triggered
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {alert.whyTriggered || alert.description}
            </p>
            <div className="pt-2 text-xs font-mono-code text-slate-400 border-t border-slate-800/60">
              Rule Logic: <span className="text-yellow-400/90">{alert.evidence.matchedRuleLogic}</span>
            </div>
          </div>

          <div className="p-4 bg-[#080c14] rounded border border-slate-800 space-y-2">
            <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-200">
              Correlated Threat IOCs
            </h3>
            {alert.associatedIocValues && alert.associatedIocValues.length > 0 ? (
              <div className="space-y-1.5 font-mono-code text-xs">
                {alert.associatedIocValues.map((ioc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-1.5 bg-[#0a0f1d] rounded border border-slate-800">
                    <span className="text-slate-300 font-semibold">{ioc}</span>
                    <Link href="/threat-intel" className="text-purple-400 hover:underline text-[11px] flex items-center gap-1">
                      <Fingerprint size={12} />
                      <span>IOC Profile</span>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs font-mono-code text-slate-500">No external IOC hashes attached to this alert.</div>
            )}
          </div>
        </div>

        {/* Related Events Section */}
        {alert.relatedEvents && alert.relatedEvents.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-200">
              Corroborating Windows Security Events ({alert.relatedEvents.length})
            </h3>
            {alert.relatedEvents.map((evt) => (
              <JsonViewer
                key={evt.id}
                title={`Raw Windows Event ${evt.eventId} (${evt.id}) - ${evt.eventName}`}
                data={evt.rawXmlOrJson}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dedicated Create Incident Modal / Form */}
      <CreateIncidentModal
        isOpen={isCreateIncidentModalOpen}
        alert={alert}
        onClose={() => setIsCreateIncidentModalOpen(false)}
        onSubmit={handleCreateIncidentSubmit}
      />

      {/* Link to Existing Incident Confirmation Modal */}
      <ConfirmationModal
        isOpen={isLinkModalOpen}
        title="Link to Existing Incident"
        description={`Link alert ${alert.id} directly to Incident INC-2026-0421 (Multi-Stage Lateral Movement)?`}
        confirmText="Link to Incident"
        onConfirm={handleConfirmLink}
        onClose={() => setIsLinkModalOpen(false)}
      />

      {/* Mark False Positive Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDismissModalOpen}
        title="Mark as False Positive"
        description={`Dismiss alert ${alert.id} and mark it as benign/false positive? This will remove it from the active critical triage queue.`}
        confirmText="Dismiss Alert"
        isDestructive={true}
        onConfirm={handleConfirmDismiss}
        onClose={() => setIsDismissModalOpen(false)}
      />
    </div>
  );
}
