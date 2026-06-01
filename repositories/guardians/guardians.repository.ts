import { prisma } from "@/app/lib/prisma";

export const guardiansRepository = {
  findAll() {
    return prisma.guardians.findMany({
      where: { is_deleted: false },
      orderBy: { created_at: "desc" },
    });
  },

  findByIdentity(identity_number: string, excludeId?: string) {
    return prisma.guardians.findFirst({
      where: {
        identity_number,
        is_deleted: false,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
  },

  findSimilar(data: {
    full_name_ar: string;
    birth_date?: string | null;
    excludeId?: string;
  }) {
    return prisma.guardians.findFirst({
      where: {
        full_name_ar: data.full_name_ar,
        birth_date: data.birth_date ? new Date(data.birth_date) : null,
        is_deleted: false,
        id: data.excludeId ? { not: data.excludeId } : undefined,
      },
    });
  },

  create(data: any) {
    return prisma.guardians.create({ data });
  },

  update(id: string, data: any) {
    return prisma.guardians.update({
      where: { id },
      data,
    });
  },
};