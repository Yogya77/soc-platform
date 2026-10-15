import { prisma } from '@/lib/prisma';
import { Incident, IncidentStatus, AlertSeverity } from '@/types/security';
import { IncidentFilterOptions } from '@/services/api.interface';

export class IncidentsService {
  static async getIncidents(filters?: IncidentFilterOptions): Promise<Incident[]> {
    const where: any = {};

    if (filters?.severity && filters.severity !== 'ALL') {
      where.severity = filters.severity;
    }
    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }
    if (filters?.assignedAnalyst && filters.assignedAnalyst !== 'ALL') {
      where.assignedAnalyst = { contains: filters.assignedAnalyst, mode: 'insensitive' };
    }
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { id: { contains: filters.search, mode: 'insensitive' } },
        { rootCauseHypothesis: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const records = await prisma.incident.findMany({
      where,
      include: {
        affectedAssets: true,
        alerts: true,
        timeline: { orderBy: { timestamp: 'asc' } },
        notes: { orderBy: { timestamp: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return records.map((r) => ({
      id: r.id,
      title: r.title,
      severity: r.severity as any,
      riskScore: r.riskScore,
      status: r.status as any,
      assignedAnalyst: r.assignedAnalyst,
      affectedAssetIds: r.affectedAssets.map((a) => a.assetId),
      alertIds: r.alerts.map((a) => a.id),
      rootCauseHypothesis: r.rootCauseHypothesis,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      mitreTactics: r.mitreTactics,
      timeline: r.timeline.map((t) => ({
        id: t.id,
        timestamp: t.timestamp.toISOString(),
        stage: t.stage as any,
        title: t.title,
        description: t.description,
        sourceType: t.sourceType as any,
        referenceId: t.referenceId ?? undefined,
      })),
      notes: r.notes.map((n) => ({
        id: n.id,
        timestamp: n.timestamp.toISOString(),
        author: n.author,
        content: n.content,
      })),
      isAiAnalyzed: r.isAiAnalyzed,
    }));
  }

  static async getIncidentById(id: string): Promise<Incident | null> {
    const r = await prisma.incident.findUnique({
      where: { id },
      include: {
        affectedAssets: true,
        alerts: true,
        timeline: { orderBy: { timestamp: 'asc' } },
        notes: { orderBy: { timestamp: 'desc' } },
      },
    });

    if (!r) return null;

    return {
      id: r.id,
      title: r.title,
      severity: r.severity as any,
      riskScore: r.riskScore,
      status: r.status as any,
      assignedAnalyst: r.assignedAnalyst,
      affectedAssetIds: r.affectedAssets.map((a) => a.assetId),
      alertIds: r.alerts.map((a) => a.id),
      rootCauseHypothesis: r.rootCauseHypothesis,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      mitreTactics: r.mitreTactics,
      timeline: r.timeline.map((t) => ({
        id: t.id,
        timestamp: t.timestamp.toISOString(),
        stage: t.stage as any,
        title: t.title,
        description: t.description,
        sourceType: t.sourceType as any,
        referenceId: t.referenceId ?? undefined,
      })),
      notes: r.notes.map((n) => ({
        id: n.id,
        timestamp: n.timestamp.toISOString(),
        author: n.author,
        content: n.content,
      })),
      isAiAnalyzed: r.isAiAnalyzed,
    };
  }

  static async createIncident(data: {
    title: string;
    severity?: AlertSeverity;
    riskScore?: number;
    assignedAnalyst?: string;
    rootCauseHypothesis?: string;
    mitreTactics?: string[];
    affectedAssetIds?: string[];
    alertIds?: string[];
  }): Promise<Incident> {
    const newId = `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const [created] = await prisma.$transaction([
      prisma.incident.create({
        data: {
          id: newId,
          title: data.title,
          severity: data.severity || 'HIGH',
          riskScore: data.riskScore ?? 50,
          status: 'OPEN',
          assignedAnalyst: data.assignedAnalyst || 'Sarah Jenkins (Lead IR)',
          rootCauseHypothesis: data.rootCauseHypothesis || 'Manual incident creation by SOC Analyst.',
          mitreTactics: data.mitreTactics || ['Execution'],
          affectedAssets: {
            create: (data.affectedAssetIds || []).map((assetId) => ({ assetId })),
          },
          timeline: {
            create: [
              {
                id: `TL-${Date.now()}`,
                stage: 'INCIDENT_CREATED',
                title: `Incident ${newId} initialized`,
                description: data.title,
                sourceType: 'SOC Analyst',
                timestamp: new Date(),
              },
            ],
          },
        },
        include: {
          affectedAssets: true,
          alerts: true,
          timeline: true,
          notes: true,
        },
      }),
      prisma.auditLog.create({
        data: {
          id: `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`,
          analyst: data.assignedAnalyst || 'Sarah Jenkins',
          action: 'INCIDENT_CREATED',
          targetType: 'INCIDENT',
          targetId: newId,
          details: `Created new incident: ${data.title}`,
        },
      }),
    ]);

    return {
      id: created.id,
      title: created.title,
      severity: created.severity as any,
      riskScore: created.riskScore,
      status: created.status as any,
      assignedAnalyst: created.assignedAnalyst,
      affectedAssetIds: created.affectedAssets.map((a) => a.assetId),
      alertIds: created.alerts.map((a) => a.id),
      rootCauseHypothesis: created.rootCauseHypothesis,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
      mitreTactics: created.mitreTactics,
      timeline: created.timeline.map((t) => ({
        id: t.id,
        timestamp: t.timestamp.toISOString(),
        stage: t.stage as any,
        title: t.title,
        description: t.description,
        sourceType: t.sourceType as any,
        referenceId: t.referenceId ?? undefined,
      })),
      notes: [],
      isAiAnalyzed: created.isAiAnalyzed,
    };
  }

  static async updateStatus(id: string, status: IncidentStatus, analyst = 'Sarah Jenkins'): Promise<Incident> {
    await prisma.$transaction([
      prisma.incident.update({
        where: { id },
        data: { status, updatedAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          id: `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`,
          analyst,
          action: `INCIDENT_STATUS_${status}`,
          targetType: 'INCIDENT',
          targetId: id,
          details: `Updated incident ${id} status to ${status}.`,
        },
      }),
    ]);

    return (await this.getIncidentById(id))!;
  }

  static async updateSeverity(id: string, severity: AlertSeverity, analyst = 'Sarah Jenkins'): Promise<Incident> {
    await prisma.$transaction([
      prisma.incident.update({
        where: { id },
        data: { severity, updatedAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          id: `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`,
          analyst,
          action: 'INCIDENT_SEVERITY_CHANGED',
          targetType: 'INCIDENT',
          targetId: id,
          details: `Changed incident ${id} severity to ${severity}.`,
        },
      }),
    ]);

    return (await this.getIncidentById(id))!;
  }

  static async assignAnalyst(id: string, analyst: string, actingAnalyst = 'Sarah Jenkins'): Promise<Incident> {
    await prisma.$transaction([
      prisma.incident.update({
        where: { id },
        data: { assignedAnalyst: analyst, updatedAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          id: `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`,
          analyst: actingAnalyst,
          action: 'INCIDENT_ANALYST_ASSIGNED',
          targetType: 'INCIDENT',
          targetId: id,
          details: `Assigned analyst ${analyst} to ${id}.`,
        },
      }),
    ]);

    return (await this.getIncidentById(id))!;
  }

  static async addNote(id: string, author: string, content: string): Promise<Incident> {
    await prisma.$transaction([
      prisma.incidentNote.create({
        data: {
          id: `NOTE-${Date.now()}`,
          incidentId: id,
          author,
          content,
          timestamp: new Date(),
        },
      }),
      prisma.incident.update({
        where: { id },
        data: { updatedAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          id: `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`,
          analyst: author,
          action: 'INCIDENT_NOTE_ADDED',
          targetType: 'INCIDENT',
          targetId: id,
          details: `Added note: "${content.slice(0, 60)}..."`,
        },
      }),
    ]);

    return (await this.getIncidentById(id))!;
  }
}
