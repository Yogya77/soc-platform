import { prisma } from '@/lib/prisma';
import { WindowsSecurityEvent } from '@/types/events';
import { EventFilterOptions } from '@/services/api.interface';

export class EventsService {
  static async getEvents(filters?: EventFilterOptions): Promise<WindowsSecurityEvent[]> {
    const where: any = {};

    if (filters?.eventId) {
      where.eventId = filters.eventId;
    }
    if (filters?.hostname && filters.hostname !== 'ALL') {
      where.hostname = filters.hostname;
    }
    if (filters?.username) {
      where.username = { contains: filters.username, mode: 'insensitive' };
    }
    if (filters?.severity && filters.severity !== 'ALL') {
      where.severity = filters.severity;
    }
    if (filters?.search) {
      where.OR = [
        { eventName: { contains: filters.search, mode: 'insensitive' } },
        { id: { contains: filters.search, mode: 'insensitive' } },
        { processCommandLine: { contains: filters.search, mode: 'insensitive' } },
        { sourceIp: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const records = await prisma.securityEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: Math.min(filters?.limit || 100, 250),
    });

    return records.map((e) => ({
      ...e,
      timestamp: e.timestamp.toISOString(),
      eventId: e.eventId as any,
      severity: e.severity as any,
      status: e.status as any,
      provider: e.provider as any,
      sourceIp: e.sourceIp ?? undefined,
      destinationIp: e.destinationIp ?? undefined,
      processName: e.processName ?? undefined,
      processCommandLine: e.processCommandLine ?? undefined,
      parentProcessName: e.parentProcessName ?? undefined,
      logonType: e.logonType ?? undefined,
      detectionRelevance: e.detectionRelevance ?? undefined,
      rawXmlOrJson: e.rawXmlOrJson as any,
    }));
  }

  static async getEventById(id: string): Promise<WindowsSecurityEvent | null> {
    const e = await prisma.securityEvent.findUnique({ where: { id } });
    if (!e) return null;

    return {
      ...e,
      timestamp: e.timestamp.toISOString(),
      eventId: e.eventId as any,
      severity: e.severity as any,
      status: e.status as any,
      provider: e.provider as any,
      sourceIp: e.sourceIp ?? undefined,
      destinationIp: e.destinationIp ?? undefined,
      processName: e.processName ?? undefined,
      processCommandLine: e.processCommandLine ?? undefined,
      parentProcessName: e.parentProcessName ?? undefined,
      logonType: e.logonType ?? undefined,
      detectionRelevance: e.detectionRelevance ?? undefined,
      rawXmlOrJson: e.rawXmlOrJson as any,
    };
  }
}
