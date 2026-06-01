import { prisma } from "@/app/lib/prisma";

export const themeRepository = {
  async getSettings() {
    const existing = await prisma.system_settings.findFirst();

    if (existing) return existing;

    return prisma.system_settings.create({
      data: {
        organization_name: "نظام إدارة المستفيدين",
      },
    });
  },

  async updateSettings(id: string, data: any) {
    return prisma.system_settings.update({
      where: { id },
      data,
    });
  },
};