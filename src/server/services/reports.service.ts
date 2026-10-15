import { prisma } from '@/lib/prisma';
import { InvestigationReport } from '@/types/security';

export class ReportsService {
  static async getReport(incidentId: string): Promise<InvestigationReport | null> {
    const report = await prisma.investigationReport.findUnique({
      where: { incidentId },
    });

    if (!report) return null;

    return {
      id: report.id,
      incidentId: report.incidentId,
      generatedAt: report.generatedAt.toISOString(),
      classification: report.classification as any,
      title: report.title,
      severity: report.severity as any,
      executiveSummary: report.executiveSummary,
      observedEvidence: report.observedEvidence as any,
      simulatedAiAssessment: report.simulatedAiAssessment as any,
      recommendedActions: report.recommendedActions as any,
      analystActionHistory: (report.analystActionHistory as any) ?? undefined,
    };
  }

  static async generateReport(incidentId: string, analyst = 'Sarah Jenkins'): Promise<InvestigationReport> {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        affectedAssets: true,
        aiInvestigation: { include: { containmentActions: true } },
      },
    });

    if (!incident) throw new Error(`Incident ${incidentId} not found.`);

    const reportId = `REP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const recentLogs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5,
    });

    const reportData = {
      id: reportId,
      incidentId,
      classification: 'CONFIDENTIAL // SOC INTERNAL USE',
      title: `Executive Incident Response Report: ${incident.title}`,
      severity: incident.severity,
      executiveSummary: `On ${new Date().toLocaleDateString()}, the SOC responded to security incident ${incidentId}. Correlated telemetry confirmed multi-stage lateral movement. Containment playbooks have been proposed and reviewed.`,
      observedEvidence: {
        summary: 'Corroborated security events across multiple host boundaries.',
        eventsAnalyzed: 6,
        affectedAssets: incident.affectedAssets.map((a) => a.assetId),
        iocs: ['198.51.100.42 (Simulated Threat IP)', 'PSEXESVC.exe'],
      },
      simulatedAiAssessment: {
        verdict: 'Targeted Multi-Stage Intrusion',
        threatActor: 'Simulated Threat Unit (Demo)',
        confidence: 96,
        disclaimer: 'Assessment confidence — simulated analytical inference',
        technicalDetails: 'Temporal correlation of anomalous logon failures and administrative service installation.',
      },
      recommendedActions: [
        { category: 'Containment', action: 'Workstation isolation of WKS-FIN-04', status: 'COMPLETED' },
        { category: 'Containment', action: 'Perimeter firewall block on 198.51.100.42', status: 'COMPLETED' },
        { category: 'Remediation', action: 'Active Directory KRBTGT password rotation', status: 'PENDING' },
      ],
      analystActionHistory: recentLogs.map((l) => ({
        timestamp: l.timestamp.toLocaleTimeString(),
        analyst: l.analyst,
        action: l.details,
      })),
    };

    const [createdReport] = await prisma.$transaction([
      prisma.investigationReport.upsert({
        where: { incidentId },
        update: {
          title: reportData.title,
          severity: reportData.severity,
          executiveSummary: reportData.executiveSummary,
          observedEvidence: reportData.observedEvidence as any,
          simulatedAiAssessment: reportData.simulatedAiAssessment as any,
          recommendedActions: reportData.recommendedActions as any,
          analystActionHistory: reportData.analystActionHistory as any,
          generatedAt: new Date(),
        },
        create: {
          ...reportData,
          generatedAt: new Date(),
          observedEvidence: reportData.observedEvidence as any,
          simulatedAiAssessment: reportData.simulatedAiAssessment as any,
          recommendedActions: reportData.recommendedActions as any,
          analystActionHistory: reportData.analystActionHistory as any,
        },
      }),
      prisma.auditLog.create({
        data: {
          id: `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`,
          analyst,
          action: 'REPORT_GENERATED',
          targetType: 'REPORT',
          targetId: reportId,
          details: `Generated formal incident investigation report ${reportId} for ${incidentId}.`,
        },
      }),
    ]);

    return {
      id: createdReport.id,
      incidentId: createdReport.incidentId,
      generatedAt: createdReport.generatedAt.toISOString(),
      classification: createdReport.classification as any,
      title: createdReport.title,
      severity: createdReport.severity as any,
      executiveSummary: createdReport.executiveSummary,
      observedEvidence: createdReport.observedEvidence as any,
      simulatedAiAssessment: createdReport.simulatedAiAssessment as any,
      recommendedActions: createdReport.recommendedActions as any,
      analystActionHistory: (createdReport.analystActionHistory as any) ?? undefined,
    };
  }
}
