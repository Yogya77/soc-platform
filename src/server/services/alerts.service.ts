import { prisma } from '@/lib/prisma';
import { Alert, AlertStatus, CreateIncidentPayload, Incident } from '@/types/security';
import { AlertFilterOptions } from '@/services/api.interface';

export class AlertsService {
  static async getAlerts(filters?: AlertFilterOptions): Promise<Alert[]> {
    const where: any = {};

    if (filters?.severity && filters.severity !== 'ALL') {
      where.severity = filters.severity;
    }
    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }
    if (filters?.assetId) {
      where.assetId = filters.assetId;
    }
    if (filters?.ruleId) {
      where.ruleId = filters.ruleId;
    }
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { id: { contains: filters.search, mode: 'insensitive' } },
        { hostname: { contains: filters.search, mode: 'insensitive' } },
        { ruleName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const records = await prisma.alert.findMany({
      where,
      orderBy: { detectedAt: 'desc' },
      take: 100,
    });

    return records.map((r) => ({
      ...r,
      detectedAt: r.detectedAt.toISOString(),
      confidenceScore: r.confidenceScore,
      evidence: r.evidence as any,
      severity: r.severity as any,
      status: r.status as any,
      sourceIp: r.sourceIp ?? undefined,
      destinationIp: r.destinationIp ?? undefined,
      username: r.username ?? undefined,
      incidentId: r.incidentId ?? undefined,
      mitreTechniqueId: r.mitreTechniqueId ?? undefined,
      mitreTechniqueName: r.mitreTechniqueName ?? undefined,
      mitreTactic: r.mitreTactic ?? undefined,
      whyTriggered: r.whyTriggered ?? undefined,
    }));
  }

  static async getAlertById(id: string): Promise<Alert | null> {
    const record = await prisma.alert.findUnique({
      where: { id },
      include: {
        asset: true,
        rule: true,
      },
    });

    if (!record) return null;

    // Fetch related events referenced in evidence
    const evidenceObj = record.evidence as any;
    const rawEventIds: string[] = evidenceObj?.rawEventIds || [];
    const relatedEvents = rawEventIds.length > 0
      ? await prisma.securityEvent.findMany({
          where: { id: { in: rawEventIds } },
        })
      : [];

    return {
      ...record,
      detectedAt: record.detectedAt.toISOString(),
      confidenceScore: record.confidenceScore,
      evidence: evidenceObj,
      severity: record.severity as any,
      status: record.status as any,
      sourceIp: record.sourceIp ?? undefined,
      destinationIp: record.destinationIp ?? undefined,
      username: record.username ?? undefined,
      incidentId: record.incidentId ?? undefined,
      mitreTechniqueId: record.mitreTechniqueId ?? undefined,
      mitreTechniqueName: record.mitreTechniqueName ?? undefined,
      mitreTactic: record.mitreTactic ?? undefined,
      whyTriggered: record.whyTriggered ?? undefined,
      relatedEvents: relatedEvents.map((e) => ({
        ...e,
        timestamp: e.timestamp.toISOString(),
        severity: e.severity as any,
        status: e.status as any,
        provider: e.provider as any,
        eventId: e.eventId as any,
        sourceIp: e.sourceIp ?? undefined,
        destinationIp: e.destinationIp ?? undefined,
        processName: e.processName ?? undefined,
        processCommandLine: e.processCommandLine ?? undefined,
        parentProcessName: e.parentProcessName ?? undefined,
        logonType: e.logonType ?? undefined,
        detectionRelevance: e.detectionRelevance ?? undefined,
        rawXmlOrJson: e.rawXmlOrJson as any,
      })),
    };
  }

  static async updateStatus(id: string, status: AlertStatus, note?: string, analyst = 'Sarah Jenkins'): Promise<Alert> {
    const [updated] = await prisma.$transaction([
      prisma.alert.update({
        where: { id },
        data: { status },
      }),
      prisma.auditLog.create({
        data: {
          id: `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`,
          analyst,
          action: `ALERT_STATUS_${status}`,
          targetType: 'ALERT',
          targetId: id,
          details: note || `Updated alert ${id} status to ${status}.`,
        },
      }),
    ]);

    return {
      ...updated,
      detectedAt: updated.detectedAt.toISOString(),
      confidenceScore: updated.confidenceScore,
      evidence: updated.evidence as any,
      severity: updated.severity as any,
      status: updated.status as any,
      sourceIp: updated.sourceIp ?? undefined,
      destinationIp: updated.destinationIp ?? undefined,
      username: updated.username ?? undefined,
      incidentId: updated.incidentId ?? undefined,
      mitreTechniqueId: updated.mitreTechniqueId ?? undefined,
      mitreTechniqueName: updated.mitreTechniqueName ?? undefined,
      mitreTactic: updated.mitreTactic ?? undefined,
      whyTriggered: updated.whyTriggered ?? undefined,
    };
  }

  static async escalateToIncident(
    alertId: string,
    payload?: CreateIncidentPayload | string,
    analyst = 'Sarah Jenkins (Lead IR)'
  ): Promise<Incident> {
    const alert = await prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert) throw new Error(`Alert with id ${alertId} not found.`);

    const title = typeof payload === 'string' ? payload : payload?.title || `Incident generated from ${alert.title}`;
    const severity = typeof payload === 'object' && payload?.severity ? payload.severity : alert.severity;
    const riskScore = typeof payload === 'object' && payload?.riskScore !== undefined
      ? payload.riskScore
      : (alert.severity === 'CRITICAL' ? 90 : alert.severity === 'HIGH' ? 75 : 50);
    const assignedAnalyst = typeof payload === 'object' && payload?.assignedAnalyst ? payload.assignedAnalyst : analyst;
    const rootCauseHypothesis = typeof payload === 'object' && payload?.description
      ? payload.description
      : (alert.whyTriggered || alert.description || `Investigation triggered by rule ${alert.ruleName} on host ${alert.hostname}.`);

    const newIncidentId = `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const [newIncident] = await prisma.$transaction([
      prisma.incident.create({
        data: {
          id: newIncidentId,
          title,
          severity,
          riskScore,
          status: 'OPEN',
          assignedAnalyst,
          rootCauseHypothesis,
          mitreTactics: [alert.mitreTactic || 'Execution'],
          affectedAssets: {
            create: [{ assetId: alert.assetId }],
          },
          timeline: {
            create: [
              {
                id: `TL-${Date.now()}`,
                stage: 'INCIDENT_CREATED',
                title: `Incident created from Alert ${alert.id}`,
                description: rootCauseHypothesis,
                sourceType: 'SOC Analyst',
                referenceId: alert.id,
                timestamp: new Date(),
              },
            ],
          },
          notes: {
            create: [
              {
                id: `NOTE-${Date.now()}`,
                author: assignedAnalyst,
                content: `Incident escalated from Alert ${alert.id} (${alert.title}). Initial assessment: ${rootCauseHypothesis}`,
                timestamp: new Date(),
              },
            ],
          },
        },
        include: {
          timeline: true,
          notes: true,
          affectedAssets: true,
          alerts: true,
        },
      }),
      prisma.alert.update({
        where: { id: alertId },
        data: {
          status: 'ESCALATED',
          incidentId: newIncidentId,
        },
      }),
      prisma.auditLog.create({
        data: {
          id: `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`,
          analyst: assignedAnalyst,
          action: 'INCIDENT_CREATED_FROM_ALERT',
          targetType: 'INCIDENT',
          targetId: newIncidentId,
          details: `Escalated alert ${alertId} to new incident ${newIncidentId}.`,
        },
      }),
    ]);

    return {
      id: newIncident.id,
      title: newIncident.title,
      severity: newIncident.severity as any,
      riskScore: newIncident.riskScore,
      status: newIncident.status as any,
      assignedAnalyst: newIncident.assignedAnalyst,
      affectedAssetIds: [alert.assetId],
      alertIds: [alert.id],
      rootCauseHypothesis: newIncident.rootCauseHypothesis,
      createdAt: newIncident.createdAt.toISOString(),
      updatedAt: newIncident.updatedAt.toISOString(),
      mitreTactics: newIncident.mitreTactics,
      timeline: newIncident.timeline.map((t) => ({
        id: t.id,
        timestamp: t.timestamp.toISOString(),
        stage: t.stage as any,
        title: t.title,
        description: t.description,
        sourceType: t.sourceType as any,
        referenceId: t.referenceId ?? undefined,
      })),
      notes: newIncident.notes.map((n) => ({
        id: n.id,
        timestamp: n.timestamp.toISOString(),
        author: n.author,
        content: n.content,
      })),
      isAiAnalyzed: newIncident.isAiAnalyzed,
    };
  }

  static async linkToIncident(alertId: string, incidentId: string, analyst = 'Sarah Jenkins'): Promise<Incident> {
    const alert = await prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert) throw new Error(`Alert with id ${alertId} not found.`);

    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        affectedAssets: true,
        timeline: true,
        notes: true,
        alerts: true,
      },
    });
    if (!incident) throw new Error(`Incident with id ${incidentId} not found.`);

    await prisma.$transaction([
      prisma.alert.update({
        where: { id: alertId },
        data: {
          incidentId,
          status: 'ESCALATED',
        },
      }),
      prisma.incidentAsset.upsert({
        where: { incidentId_assetId: { incidentId, assetId: alert.assetId } },
        update: {},
        create: { incidentId, assetId: alert.assetId },
      }),
      prisma.incidentTimeline.create({
        data: {
          id: `TL-${Date.now()}`,
          incidentId,
          stage: 'ALERT',
          title: `Alert ${alert.id} linked to incident`,
          description: alert.title,
          sourceType: 'SOC Analyst',
          referenceId: alert.id,
          timestamp: new Date(),
        },
      }),
      prisma.auditLog.create({
        data: {
          id: `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`,
          analyst,
          action: 'ALERT_LINKED_TO_INCIDENT',
          targetType: 'ALERT',
          targetId: alertId,
          details: `Linked alert ${alertId} to incident ${incidentId}.`,
        },
      }),
    ]);

    // Refetch updated incident
    const updated = await prisma.incident.findUniqueOrThrow({
      where: { id: incidentId },
      include: {
        affectedAssets: true,
        timeline: true,
        notes: true,
        alerts: true,
      },
    });

    return {
      id: updated.id,
      title: updated.title,
      severity: updated.severity as any,
      riskScore: updated.riskScore,
      status: updated.status as any,
      assignedAnalyst: updated.assignedAnalyst,
      affectedAssetIds: updated.affectedAssets.map((a) => a.assetId),
      alertIds: updated.alerts.map((a) => a.id),
      rootCauseHypothesis: updated.rootCauseHypothesis,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      mitreTactics: updated.mitreTactics,
      timeline: updated.timeline.map((t) => ({
        id: t.id,
        timestamp: t.timestamp.toISOString(),
        stage: t.stage as any,
        title: t.title,
        description: t.description,
        sourceType: t.sourceType as any,
        referenceId: t.referenceId ?? undefined,
      })),
      notes: updated.notes.map((n) => ({
        id: n.id,
        timestamp: n.timestamp.toISOString(),
        author: n.author,
        content: n.content,
      })),
      isAiAnalyzed: updated.isAiAnalyzed,
    };
  }
}
