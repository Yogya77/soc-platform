import { prisma } from '@/lib/prisma';
import { AnalystAuditLog } from '@/types/security';

export class AuditService {
  static async getLogs(limit = 100): Promise<AnalystAuditLog[]> {
    const records = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: Math.min(limit, 250),
    });

    return records.map((l) => ({
      id: l.id,
      timestamp: l.timestamp.toISOString(),
      analyst: l.analyst,
      action: l.action,
      targetType: l.targetType as any,
      targetId: l.targetId,
      details: l.details,
    }));
  }

  static async addLog(entry: Omit<AnalystAuditLog, 'id' | 'timestamp'>): Promise<AnalystAuditLog> {
    const id = `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`;
    const created = await prisma.auditLog.create({
      data: {
        id,
        analyst: entry.analyst,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        details: entry.details,
        timestamp: new Date(),
      },
    });

    return {
      id: created.id,
      timestamp: created.timestamp.toISOString(),
      analyst: created.analyst,
      action: created.action,
      targetType: created.targetType as any,
      targetId: created.targetId,
      details: created.details,
    };
  }
}
