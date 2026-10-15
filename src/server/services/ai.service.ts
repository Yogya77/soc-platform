import { prisma } from '@/lib/prisma';
import { AIInvestigationResult, RecommendationStatus } from '@/types/security';
import { mockAiInvestigation } from '@/services/mock.data';
import { AssetsService } from './assets.service';

export class AIService {
  static async startInvestigation(incidentId: string, analyst = 'AI Analyst Engine'): Promise<AIInvestigationResult> {
    const existing = await prisma.aIInvestigation.findUnique({
      where: { incidentId },
      include: { containmentActions: true },
    });

    if (existing) {
      await prisma.auditLog.create({
        data: {
          id: `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`,
          analyst,
          action: 'AI_INVESTIGATION_RESTARTED',
          targetType: 'AI_INVESTIGATION',
          targetId: incidentId,
          details: `Re-ran automated reasoning sequence for incident ${incidentId}.`,
        },
      });

      return {
        incidentId: existing.incidentId,
        status: existing.status as any,
        currentStepIndex: existing.currentStepIndex,
        steps: existing.steps as any,
        observedEvidence: existing.observedEvidence as any,
        simulatedAiAssessment: existing.simulatedAiAssessment as any,
        recommendations: {
          containmentActions: existing.containmentActions.map((c) => ({
            id: c.id,
            action: c.action,
            severity: c.severity as any,
            target: c.target,
            reason: c.reason,
            priority: c.priority as any,
            status: c.status as any,
            isAutomatedAvailable: c.isAutomatedAvailable,
            executedAt: c.executedAt ? c.executedAt.toISOString() : undefined,
          })),
          investigativeNextSteps: existing.investigativeNextSteps,
          longTermRemediation: existing.longTermRemediation,
        },
        completedAt: existing.completedAt ? existing.completedAt.toISOString() : undefined,
      };
    }

    // Initialize new investigation based on incident data
    const created = await prisma.aIInvestigation.create({
      data: {
        incidentId,
        status: 'COMPLETED',
        currentStepIndex: 8,
        steps: mockAiInvestigation.steps as any,
        observedEvidence: mockAiInvestigation.observedEvidence as any,
        simulatedAiAssessment: mockAiInvestigation.simulatedAiAssessment as any,
        investigativeNextSteps: mockAiInvestigation.recommendations.investigativeNextSteps,
        longTermRemediation: mockAiInvestigation.recommendations.longTermRemediation,
        completedAt: new Date(),
        containmentActions: {
          create: mockAiInvestigation.recommendations.containmentActions.map((rec) => ({
            id: rec.id,
            action: rec.action,
            severity: rec.severity,
            target: rec.target,
            reason: rec.reason,
            priority: rec.priority,
            status: rec.status,
            isAutomatedAvailable: rec.isAutomatedAvailable,
          })),
        },
      },
      include: { containmentActions: true },
    });

    await prisma.auditLog.create({
      data: {
        id: `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`,
        analyst,
        action: 'AI_INVESTIGATION_STARTED',
        targetType: 'AI_INVESTIGATION',
        targetId: incidentId,
        details: `Initiated 8-stage automated reasoning sequence for ${incidentId}.`,
      },
    });

    return {
      incidentId: created.incidentId,
      status: created.status as any,
      currentStepIndex: created.currentStepIndex,
      steps: created.steps as any,
      observedEvidence: created.observedEvidence as any,
      simulatedAiAssessment: created.simulatedAiAssessment as any,
      recommendations: {
        containmentActions: created.containmentActions.map((c) => ({
          id: c.id,
          action: c.action,
          severity: c.severity as any,
          target: c.target,
          reason: c.reason,
          priority: c.priority as any,
          status: c.status as any,
          isAutomatedAvailable: c.isAutomatedAvailable,
          executedAt: c.executedAt ? c.executedAt.toISOString() : undefined,
        })),
        investigativeNextSteps: created.investigativeNextSteps,
        longTermRemediation: created.longTermRemediation,
      },
      completedAt: created.completedAt ? created.completedAt.toISOString() : undefined,
    };
  }

  static async getInvestigation(incidentId: string): Promise<AIInvestigationResult | null> {
    const existing = await prisma.aIInvestigation.findUnique({
      where: { incidentId },
      include: { containmentActions: true },
    });

    if (!existing) return null;

    return {
      incidentId: existing.incidentId,
      status: existing.status as any,
      currentStepIndex: existing.currentStepIndex,
      steps: existing.steps as any,
      observedEvidence: existing.observedEvidence as any,
      simulatedAiAssessment: existing.simulatedAiAssessment as any,
      recommendations: {
        containmentActions: existing.containmentActions.map((c) => ({
          id: c.id,
          action: c.action,
          severity: c.severity as any,
          target: c.target,
          reason: c.reason,
          priority: c.priority as any,
          status: c.status as any,
          isAutomatedAvailable: c.isAutomatedAvailable,
          executedAt: c.executedAt ? c.executedAt.toISOString() : undefined,
        })),
        investigativeNextSteps: existing.investigativeNextSteps,
        longTermRemediation: existing.longTermRemediation,
      },
      completedAt: existing.completedAt ? existing.completedAt.toISOString() : undefined,
    };
  }

  static async updateRecommendationStatus(
    incidentId: string,
    recId: string,
    status: RecommendationStatus,
    analyst = 'Sarah Jenkins'
  ): Promise<AIInvestigationResult> {
    const executedAt = status === 'APPROVED' || status === 'EXECUTED' ? new Date() : null;

    await prisma.$transaction([
      prisma.aIRecommendation.update({
        where: { id: recId },
        data: {
          status,
          executedAt,
        },
      }),
      prisma.auditLog.create({
        data: {
          id: `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`,
          analyst,
          action: `AI_RECOMMENDATION_${status}`,
          targetType: 'AI_INVESTIGATION',
          targetId: recId,
          details: `Recommendation ${recId} status set to ${status}.`,
        },
      }),
    ]);

    // If host quarantine recommendation REC-1 is approved or rejected, trigger asset update
    if (recId === 'REC-1') {
      if (status === 'APPROVED' || status === 'EXECUTED') {
        try {
          await AssetsService.isolateAsset('AST-102', true, analyst);
        } catch {
          // Non-blocking asset update
        }
      } else if (status === 'REJECTED') {
        try {
          await AssetsService.isolateAsset('AST-102', false, analyst);
        } catch {
          // Non-blocking asset update
        }
      }
    }

    return (await this.getInvestigation(incidentId))!;
  }
}
