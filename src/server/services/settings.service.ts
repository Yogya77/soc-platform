import { prisma } from '@/lib/prisma';

export class SettingsService {
  static async getSettings(): Promise<Record<string, any>> {
    const settings = await prisma.systemSetting.findMany();
    const map: Record<string, any> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }
    return map;
  }

  static async updateSetting(key: string, value: any, description?: string): Promise<{ key: string; value: any }> {
    const updated = await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value,
        description: description ?? undefined,
        updatedAt: new Date(),
      },
      create: {
        key,
        value,
        description,
      },
    });

    return {
      key: updated.key,
      value: updated.value,
    };
  }
}
