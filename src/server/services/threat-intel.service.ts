import { prisma } from '@/lib/prisma';
import { ThreatIndicator } from '@/types/threatIntel';

export class ThreatIntelService {
  static async getThreatIntel(): Promise<ThreatIndicator[]> {
    const records = await prisma.threatIndicator.findMany({
      orderBy: { confidenceScore: 'desc' },
    });

    return records.map((i) => ({
      ...i,
      type: i.type as any,
      verdict: i.verdict as any,
      sourceLabel: i.sourceLabel as any,
      firstSeen: i.firstSeen.toISOString(),
      lastSeen: i.lastSeen.toISOString(),
      threatActor: i.threatActor ?? undefined,
      malwareFamily: i.malwareFamily ?? undefined,
      mitreTechniques: (i.mitreTechniques as any) ?? undefined,
    }));
  }

  static async getThreatIndicatorByValue(value: string): Promise<ThreatIndicator | null> {
    const record = await prisma.threatIndicator.findFirst({
      where: {
        OR: [
          { indicator: { equals: value, mode: 'insensitive' } },
          { id: { equals: value, mode: 'insensitive' } },
        ],
      },
    });

    if (!record) return null;

    return {
      ...record,
      type: record.type as any,
      verdict: record.verdict as any,
      sourceLabel: record.sourceLabel as any,
      firstSeen: record.firstSeen.toISOString(),
      lastSeen: record.lastSeen.toISOString(),
      threatActor: record.threatActor ?? undefined,
      malwareFamily: record.malwareFamily ?? undefined,
      mitreTechniques: (record.mitreTechniques as any) ?? undefined,
    };
  }
}
