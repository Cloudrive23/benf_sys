import { prisma } from "@/app/lib/prisma";

export const centersRepository = {
  findAll() {
    return prisma.centers.findMany({
      include: {
        branches: true,
        sites: true,
      },
      orderBy: { created_at: "desc" },
    });
  },

  findDuplicateName(center_name_ar: string, site_id: string, excludeId?: string) {
    return prisma.centers.findFirst({
      where: {
        center_name_ar,
        site_id,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
  },

  create(data: any) {
    return prisma.centers.create({ data });
  },

  update(id: string, data: any) {
    return prisma.centers.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.centers.delete({ where: { id } });
  },
};