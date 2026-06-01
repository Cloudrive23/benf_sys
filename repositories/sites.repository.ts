import { prisma } from "@/app/lib/prisma";

export const sitesRepository = {
  findAll() {
    return prisma.sites.findMany({
      include: { branches: true },
      orderBy: { created_at: "desc" },
    });
  },

  findDuplicateName(site_name_ar: string, branch_id: string, excludeId?: string) {
    return prisma.sites.findFirst({
      where: {
        site_name_ar,
        branch_id,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
  },

  create(data: any) {
    return prisma.sites.create({ data });
  },

  update(id: string, data: any) {
    return prisma.sites.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.sites.delete({ where: { id } });
  },
};