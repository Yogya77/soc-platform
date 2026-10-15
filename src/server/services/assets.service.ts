import { prisma } from '@/lib/prisma';
import { Asset } from '@/types/security';

export class AssetsService {
  static async getAssets(): Promise<Asset[]> {
    const records = await prisma.asset.findMany({
      orderBy: { riskScore: 'desc' },
    });

    return records.map((a) => ({
      ...a,
      health: a.health as any,
      role: a.role as any,
      isolationStatus: a.isolationStatus as any,
      lastSeen: a.lastSeen.toISOString(),
      assignedUser: a.assignedUser ?? undefined,
      department: a.department ?? undefined,
    }));
  }

  static async getAssetById(id: string): Promise<Asset | null> {
    const a = await prisma.asset.findFirst({
      where: {
        OR: [{ id }, { hostname: { equals: id, mode: 'insensitive' } }],
      },
    });

    if (!a) return null;

    return {
      ...a,
      health: a.health as any,
      role: a.role as any,
      isolationStatus: a.isolationStatus as any,
      lastSeen: a.lastSeen.toISOString(),
      assignedUser: a.assignedUser ?? undefined,
      department: a.department ?? undefined,
    };
  }

  static async isolateAsset(id: string, isolate: boolean, analyst = 'Sarah Jenkins'): Promise<Asset> {
    const asset = await this.getAssetById(id);
    if (!asset) throw new Error(`Asset ${id} not found.`);

    const [updated] = await prisma.$transaction([
      prisma.asset.update({
        where: { id: asset.id },
        data: {
          isolationStatus: isolate ? 'ISOLATED' : 'NORMAL',
          updatedAt: new Date(),
        },
      }),
      prisma.auditLog.create({
        data: {
          id: `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`,
          analyst,
          action: isolate ? 'ASSET_ISOLATED' : 'ASSET_ISOLATION_REMOVED',
          targetType: 'ASSET',
          targetId: asset.id,
          details: isolate
            ? `Simulated network quarantine enabled for host ${asset.hostname} (${asset.ipAddress}).`
            : `Simulated network quarantine released for host ${asset.hostname}.`,
        },
      }),
    ]);

    return {
      ...updated,
      health: updated.health as any,
      role: updated.role as any,
      isolationStatus: updated.isolationStatus as any,
      lastSeen: updated.lastSeen.toISOString(),
      assignedUser: updated.assignedUser ?? undefined,
      department: updated.department ?? undefined,
    };
  }
}
