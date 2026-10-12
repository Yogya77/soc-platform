'use client';

import React, { useEffect, useState } from 'react';
import { useSecurity } from '@/context/SecurityContext';
import { AIInvestigationResult, AIRecommendationItem, RecommendationStatus } from '@/types/security';
import {
  Cpu,
  CheckCircle2,
  ShieldCheck,
  Play,
  Sparkles,
  AlertOctagon,
  Check,
  X,
  FileText,
  Activity,
  Server,
  Fingerprint,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function AiAnalystPage() {
  const { runAIInvestigation, updateRecommendation, auditLogs } = useSecurity();
  const [investigation, setInvestigation] = useState<AIInvestigationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(7);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch of current state
    import('@/services').then(({ getSecurityService }) => {
      getSecurityService().getAIInvestigation('INC-2026-0421').then((res) => {
        if (res) setInvestigation(res);
      });
    });
  }, []);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const triggerProgressiveAnalysis = async () => {
    setIsAnalyzing(true);
    setActiveStepIndex(0);

    for (let i = 0; i <= 7; i++) {
      setActiveStepIndex(i);
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    const res = await runAIInvestigation('INC-2026-0421');
    setInvestigation(res);
    setIsAnalyzing(false);
    showFeedback('Simulated AI investigation sequence concluded.');
  };

  const handleRecommendationAction = async (recId: string, status: RecommendationStatus) => {
    if (!investigation) return;
    await updateRecommendation('INC-2026-0421', recId, status);
    // Reload local investigation state
    import('@/services').then(({ getSecurityService }) => {
      getSecurityService().getAIInvestigation('INC-2026-0421').then((res) => {
        if (res) setInvestigation(res);
      });
    });
    showFeedback(`Containment action ${recId} marked as ${status}.`);
  };

  const recentAiLogs = auditLogs.filter(
    (l) => l.targetType === 'AI_INVESTIGATION' || l.analyst.includes('AI') || l.details.includes('recommendation')
  );

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a] border border-slate-800/80 rounded p-5">
        <div>
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-purple-400" />
            <h1 className="text-sm font-mono-code font-bold uppercase tracking-wider text-slate-100">
              AI Analyst Investigation Workbench
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous security reasoning agent for incident correlation, root-cause inference, and automated containment playbooks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {feedback && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono-code animate-in fade-in">
              <Check size={13} />
              <span>{feedback}</span>
            </div>
          )}
          <button
            onClick={triggerProgressiveAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-mono-code font-semibold transition-colors"
          >
            {isAnalyzing ? (
              <>
                <Sparkles size={14} className="animate-spin" />
                <span>Executing Investigation Steps...</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Run Investigation (INC-2026-0421)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Investigation Progress Stepper */}
      {investigation && (
        <div className="p-4 bg-[#0f172a] border border-slate-800/80 rounded space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-200">
              Investigation Progress Pipeline (Simulated Workflow)
            </h3>
            <span className="text-xs font-mono-code text-purple-400 font-semibold">
              {isAnalyzing ? `Analyzing Stage ${activeStepIndex + 1}/8...` : `Status: COMPLETED`}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
            {investigation.steps.map((step, idx) => {
              const isCompleted = isAnalyzing ? idx < activeStepIndex : true;
              const isCurrent = isAnalyzing && idx === activeStepIndex;

              return (
                <div
                  key={idx}
                  className={cn(
                    'p-2.5 rounded border text-xs font-mono-code flex items-start gap-2 transition-all duration-200',
                    isCompleted
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : isCurrent
                      ? 'bg-purple-500/15 border-purple-500/50 text-purple-200 shadow-md scale-[1.02]'
                      : 'bg-[#080c14] border-slate-800 text-slate-500'
                  )}
                >
                  {isCurrent ? (
                    <Sparkles size={14} className="shrink-0 mt-0.5 text-purple-400 animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} className={cn('shrink-0 mt-0.5', isCompleted ? 'text-emerald-400' : 'text-slate-600')} />
                  )}
                  <div className="overflow-hidden">
                    <div className="font-bold truncate">{step.label}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{step.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main 3-Column Split: Factual Evidence vs AI Assessment vs Interactive Recommendations */}
      {investigation && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 1. Observed Evidence (Factual) */}
          <div className="bg-[#0f172a] border border-slate-800/80 rounded p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-200">
                1. Observed Evidence (Factual)
              </h3>
            </div>
            <div className="space-y-2 text-xs font-mono-code">
              <div className="p-2.5 bg-[#080c14] rounded border border-slate-800">
                <span className="text-slate-500 text-[11px]">Corroborated Telemetry:</span>
                <div className="text-slate-200 font-semibold mt-0.5">
                  {investigation.observedEvidence.corroboratedEventsCount} Windows Security Events
                </div>
              </div>
              <div className="p-2.5 bg-[#080c14] rounded border border-slate-800">
                <span className="text-slate-500 text-[11px]">Affected Endpoints:</span>
                <div className="text-slate-200 font-semibold mt-0.5">
                  {investigation.observedEvidence.affectedHostnames.join(', ')}
                </div>
              </div>
              <div className="p-2.5 bg-[#080c14] rounded border border-slate-800">
                <span className="text-slate-500 text-[11px]">Detection Rule Matches:</span>
                <div className="text-orange-400 font-semibold mt-0.5">
                  {investigation.observedEvidence.detectionRuleMatches.join('; ')}
                </div>
              </div>
              <div className="p-2.5 bg-[#080c14] rounded border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[11px]">Extracted IOC Artifacts:</span>
                {investigation.observedEvidence.extractedIocs.map((ioc, i) => (
                  <div key={i} className="text-[11px] text-slate-300 font-mono-code truncate">
                    • <span className="text-slate-500">{ioc.type}:</span> {ioc.value}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Simulated AI Assessment */}
          <div className="bg-[#0f172a] border border-purple-500/40 rounded p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-purple-300">
                  2. SIMULATED AI ASSESSMENT
                </h3>
              </div>
              <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Simulated Reasoning
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono-code">
              <div className="p-2.5 bg-[#080c14] rounded border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Confidence Score:</span>
                  <span className="text-purple-300 font-bold text-sm">
                    {investigation.simulatedAiAssessment.confidenceScore}%
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 italic mt-0.5">
                  {investigation.simulatedAiAssessment.confidenceDisclaimer}
                </div>
              </div>

              <div className="p-2.5 bg-[#080c14] rounded border border-slate-800">
                <span className="text-slate-500 text-[11px]">Threat Classification:</span>
                <div className="text-slate-100 font-bold mt-0.5">
                  {investigation.simulatedAiAssessment.threatClassification}
                </div>
              </div>

              <div className="p-2.5 bg-[#080c14] rounded border border-slate-800">
                <span className="text-slate-500 text-[11px]">MITRE Techniques:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {investigation.simulatedAiAssessment.mitreTechniques.map((t, idx) => (
                    <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-blue-300">
                      {t.id}: {t.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-2.5 bg-[#080c14] rounded border border-slate-800">
                <span className="text-slate-500 text-[11px]">Analytical Rationale:</span>
                <p className="text-xs text-slate-300 mt-1 font-sans leading-relaxed">
                  {investigation.simulatedAiAssessment.assessmentRationale}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Interactive Recommendations */}
          <div className="bg-[#0f172a] border border-slate-800/80 rounded p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h3 className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-200">
                3. Recommended Playbooks & Actions
              </h3>
            </div>

            <div className="space-y-2.5 text-xs font-mono-code">
              {investigation.recommendations.containmentActions.map((rec: AIRecommendationItem) => (
                <div
                  key={rec.id}
                  className={cn(
                    'p-2.5 bg-[#080c14] rounded border space-y-1.5 transition-colors',
                    rec.status === 'APPROVED' || rec.status === 'EXECUTED'
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : rec.status === 'REJECTED'
                      ? 'border-red-500/30 opacity-60'
                      : 'border-slate-800'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-200 font-bold text-[11px]">{rec.action}</span>
                    <span
                      className={cn(
                        'text-[9px] font-mono-code px-1.5 py-0.2 rounded uppercase shrink-0 font-bold',
                        rec.status === 'APPROVED' || rec.status === 'EXECUTED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : rec.status === 'REJECTED'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      )}
                    >
                      {rec.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 font-sans">{rec.reason}</p>
                  <div className="text-[10px] text-slate-500">Target: {rec.target}</div>

                  {/* Interactive Action Controls */}
                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-800/60">
                    {rec.status !== 'APPROVED' && rec.status !== 'EXECUTED' && (
                      <button
                        onClick={() => handleRecommendationAction(rec.id, 'APPROVED')}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold"
                      >
                        <Check size={11} />
                        <span>Approve Playbook</span>
                      </button>
                    )}
                    {rec.status !== 'REJECTED' && (
                      <button
                        onClick={() => handleRecommendationAction(rec.id, 'REJECTED')}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-700 text-[10px]"
                      >
                        <X size={11} />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <Link
                  href="/reports"
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-semibold transition-colors"
                >
                  <FileText size={14} />
                  <span>Generate Formal Incident Report</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analyst Activity Audit Log Section */}
      <div className="bg-[#0f172a] border border-slate-800/80 rounded p-4 space-y-3 font-mono-code text-xs">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-slate-200 font-bold uppercase tracking-wider">
          <Activity size={14} className="text-blue-400" />
          <span>AI & Analyst Decision Audit Trail</span>
        </div>
        <div className="space-y-2">
          {recentAiLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="p-2 bg-[#080c14] rounded border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-300">{log.analyst}:</span>{' '}
                <span className="text-slate-400">{log.details}</span>
              </div>
              <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
