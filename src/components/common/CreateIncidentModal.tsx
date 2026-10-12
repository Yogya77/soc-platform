'use client';

import React, { useState, useEffect } from 'react';
import { Alert, AlertSeverity, CreateIncidentPayload } from '@/types/security';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { AlertTriangle, X, ShieldAlert, Server, Sliders, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateIncidentModalProps {
  isOpen: boolean;
  alert: Alert;
  onClose: () => void;
  onSubmit: (payload: CreateIncidentPayload) => Promise<void>;
}

export const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({
  isOpen,
  alert,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<AlertSeverity>('CRITICAL');
  const [riskScore, setRiskScore] = useState<number>(90);
  const [assignedAnalyst, setAssignedAnalyst] = useState('Sarah Jenkins (Lead IR)');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-populate fields from the alert whenever the modal opens or alert changes
  useEffect(() => {
    if (isOpen && alert) {
      setTitle(`Incident: ${alert.title}`);
      setSeverity(alert.severity);
      const defaultRisk = alert.severity === 'CRITICAL' ? 90 : alert.severity === 'HIGH' ? 75 : alert.severity === 'MEDIUM' ? 50 : 25;
      setRiskScore(defaultRisk);
      setAssignedAnalyst('Sarah Jenkins (Lead IR)');
      setDescription(alert.whyTriggered || alert.description || `Investigation triggered by rule ${alert.ruleName} on host ${alert.hostname}.`);
      setIsSubmitting(false);
    }
  }, [isOpen, alert]);

  // Handle Escape key dismissal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim() || `Incident: ${alert.title}`,
        severity,
        riskScore,
        assignedAnalyst,
        description: description.trim() || alert.description,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#0f172a] border border-slate-700 rounded-lg max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-mono-code">
                Create Incident from Alert
              </h2>
              <div className="text-xs text-slate-400 font-mono-code mt-0.5">
                Originating Alert: <span className="text-blue-400 font-bold">{alert.id}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Read-only Alert Context Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-4 p-3 bg-[#080c14] rounded border border-slate-800 text-xs font-mono-code">
          <div className="space-y-0.5">
            <span className="text-slate-500 flex items-center gap-1 text-[11px]">
              <Server size={12} className="text-blue-400" />
              <span>Affected Host:</span>
            </span>
            <div className="text-slate-200 font-bold">{alert.hostname} ({alert.assetId})</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-500 flex items-center gap-1 text-[11px]">
              <Sliders size={12} className="text-yellow-400" />
              <span>Triggered Rule:</span>
            </span>
            <div className="text-slate-200 font-semibold truncate" title={alert.ruleName}>
              {alert.ruleName}
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-500 flex items-center gap-1 text-[11px]">
              <ShieldAlert size={12} className="text-red-400" />
              <span>MITRE Technique:</span>
            </span>
            <div className="text-blue-400 font-bold truncate">
              {alert.mitreTechniqueId || 'T1059.001'}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Incident Title */}
          <div className="space-y-1">
            <label className="block text-xs font-mono-code text-slate-300 font-semibold">
              Incident Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Incident: Suspicious PowerShell Download Cradle on WKS-FIN-04"
              className="w-full bg-[#080c14] border border-slate-800 rounded px-3 py-2 text-xs font-mono-code text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Severity, Risk Score, and Analyst in 3 Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Severity */}
            <div className="space-y-1">
              <label className="block text-xs font-mono-code text-slate-300 font-semibold">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => {
                  const newSev = e.target.value as AlertSeverity;
                  setSeverity(newSev);
                  setRiskScore(newSev === 'CRITICAL' ? 90 : newSev === 'HIGH' ? 75 : newSev === 'MEDIUM' ? 50 : 25);
                }}
                className="w-full bg-[#080c14] border border-slate-800 rounded px-3 py-2 text-xs font-mono-code text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            {/* Risk Score */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono-code text-slate-300 font-semibold">
                  Risk Score (0-100)
                </label>
                <span className="text-xs font-bold font-mono-code text-red-400">{riskScore}</span>
              </div>
              <input
                type="number"
                min={0}
                max={100}
                value={riskScore}
                onChange={(e) => setRiskScore(Number(e.target.value))}
                className="w-full bg-[#080c14] border border-slate-800 rounded px-3 py-2 text-xs font-mono-code text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Assigned Analyst */}
            <div className="space-y-1">
              <label className="block text-xs font-mono-code text-slate-300 font-semibold">
                Assigned Analyst
              </label>
              <select
                value={assignedAnalyst}
                onChange={(e) => setAssignedAnalyst(e.target.value)}
                className="w-full bg-[#080c14] border border-slate-800 rounded px-3 py-2 text-xs font-mono-code text-slate-100 focus:outline-none focus:border-blue-500 truncate"
              >
                <option value="Sarah Jenkins (Lead IR)">Sarah Jenkins (Lead IR)</option>
                <option value="Marcus Vance (Tier 2 SOC)">Marcus Vance (Tier 2 SOC)</option>
                <option value="Triage Analyst">Triage Analyst</option>
              </select>
            </div>
          </div>

          {/* Description & Root Cause Hypothesis */}
          <div className="space-y-1">
            <label className="block text-xs font-mono-code text-slate-300 font-semibold">
              Initial Assessment & Root Cause Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe initial findings, suspected intrusion vector, and containment priorities..."
              className="w-full bg-[#080c14] border border-slate-800 rounded p-3 text-xs font-mono-code text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono-code text-slate-500">
                Action: Escalate alert to active Incident Command Center
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-mono-code transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-mono-code font-bold transition-colors shadow-lg shadow-orange-600/20"
              >
                <span>{isSubmitting ? 'Creating Incident...' : 'Create & Open Incident'}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
