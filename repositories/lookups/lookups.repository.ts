import { prisma } from "@/app/lib/prisma";

export const lookupsRepository = {
  findAll(lookup_type: string) {
    return prisma.lookups.findMany({
      where: {
        lookup_type,
        is_deleted: false,
      },
      orderBy: [
        { sort_order: "asc" },
        { created_at: "desc" },
      ],
    });
  },

  findDuplicate(
    lookup_type: string,
    name_ar: string,
    excludeId?: string
  ) {
    return prisma.lookups.findFirst({
      where: {
        lookup_type,
        name_ar,
        is_deleted: false,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
  },

  create(data: any) {
    return prisma.lookups.create({
      data,
    });
  },

  update(id: string, data: any) {
    return prisma.lookups.update({
      where: { id },
      data,
    });
  },
};