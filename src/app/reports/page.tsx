'use client';

import React, { useEffect, useState } from 'react';
import { useSecurity } from '@/context/SecurityContext';
import { InvestigationReport } from '@/types/security';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { formatDate } from '@/lib/utils';
import { FileText, Printer, Check, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function ReportsPage() {
  const { incidents, generateReport, auditLogs } = useSecurity();
  const [report, setReport] = useState<InvestigationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const loadLatestReport = () => {
    setLoading(true);
    import('@/services').then(({ getSecurityService }) => {
      getSecurityService().getInvestigationReport('INC-2026-0421').then((rep) => {
        if (rep) {
          setReport(rep);
        }
        setLoading(false);
      });
    });
  };

  useEffect(() => {
    loadLatestReport();
  }, [incidents]);

  const handleRegenerate = async () => {
    const rep = await generateReport('INC-2026-0421');
    setReport(rep);
    setSyncFeedback('Report synchronized with live incident state.');
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a] border border-slate-800/80 rounded p-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-blue-400" />
            <h1 className="text-sm font-mono-code font-bold uppercase tracking-wider text-slate-100">
              Formal Investigation & Compliance Reports
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Standardized technical incident response summaries and executive forensic briefings.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {syncFeedback && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono-code animate-in fade-in">
              <Check size={13} />
              <span>{syncFeedback}</span>
            </div>
          )}
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-mono-code font-semibold transition-colors"
          >
            <RefreshCw size={13} />
            <span>Re-sync Live State</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono-code font-semibold transition-colors"
          >
            <Printer size={13} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {report && (
        <div className="bg-[#0f172a] border border-slate-800/80 rounded p-6 sm:p-8 space-y-6 max-w-4xl mx-auto shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none">
          {/* Report Header */}
          <div className="border-b border-slate-800/80 pb-5 flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 tracking-widest font-bold">
                {report.classification}
              </span>
              <h2 className="text-lg font-mono-code font-bold text-slate-100 mt-2">{report.title}</h2>
              <div className="text-xs font-mono-code text-slate-400 mt-1">
                Report ID: <span className="text-slate-200 font-semibold">{report.id}</span> | Incident Ref:{' '}
                <Link href={`/incidents/${report.incidentId}`} className="text-blue-400 font-semibold hover:underline">
                  {report.incidentId}
                </Link>{' '}
                | Generated: <span className="text-slate-300">{formatDate(report.generatedAt)}</span>
              </div>
            </div>
            <SeverityBadge severity={report.severity} />
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300">
              Executive Summary
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans bg-[#080c14] p-3.5 rounded border border-slate-800">
              {report.executiveSummary}
            </p>
          </div>

          {/* Section 1: Observed Evidence */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-blue-400">
              1. Observed Evidence & Corroborated Telemetry
            </h3>
            <div className="p-3.5 bg-[#080c14] rounded border border-slate-800 space-y-2 text-xs font-mono-code">
              <div>
                <span className="text-slate-500">Summary:</span>{' '}
                <span className="text-slate-200">{report.observedEvidence.summary}</span>
              </div>
              <div>
                <span className="text-slate-500">Affected Endpoints:</span>{' '}
                <span className="text-slate-200 font-semibold">
                  {report.observedEvidence.affectedAssets.join(', ')}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Key IOC Indicators:</span>{' '}
                <span className="text-slate-200 font-semibold">
                  {report.observedEvidence.iocs.join('; ')}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Simulated AI Assessment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-purple-400">
                2. Simulated AI Assessment & Threat Classification
              </h3>
              <span className="text-[10px] font-mono-code text-purple-400 italic">
                {report.simulatedAiAssessment.disclaimer}
              </span>
            </div>
            <div className="p-3.5 bg-[#080c14] rounded border border-purple-500/20 space-y-2 text-xs font-mono-code">
              <div>
                <span className="text-slate-500">Assessment Verdict:</span>{' '}
                <span className="text-purple-300 font-semibold">{report.simulatedAiAssessment.verdict}</span>
              </div>
              <div>
                <span className="text-slate-500">Attribution Group:</span>{' '}
                <span className="text-slate-200">{report.simulatedAiAssessment.threatActor}</span>
              </div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed pt-1">
                {report.simulatedAiAssessment.technicalDetails}
              </p>
            </div>
          </div>

          {/* Section 3: Recommended Actions */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-emerald-400">
              3. Recommended Mitigation Actions & Containment Status
            </h3>
            <div className="space-y-1.5">
              {report.recommendedActions.map((act, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-[#080c14] rounded border border-slate-800 flex items-center justify-between text-xs font-mono-code"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                      {act.category}
                    </span>
                    <span className="text-slate-200 font-sans">{act.action}</span>
                  </div>
                  <span
                    className={
                      act.status === 'COMPLETED'
                        ? 'text-emerald-400 font-semibold text-[11px]'
                        : act.status === 'PENDING'
                        ? 'text-amber-400 font-semibold text-[11px]'
                        : 'text-slate-400 font-semibold text-[11px]'
                    }
                  >
                    {act.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Analyst Audit Trail */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300">
              4. Response Actions & Decision History
            </h3>
            <div className="p-3 bg-[#080c14] rounded border border-slate-800 space-y-1.5 font-mono-code text-xs">
              {auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">
                    <span className="text-slate-500 font-bold">{log.analyst}:</span> {log.details}
                  </span>
                  <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
