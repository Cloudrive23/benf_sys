import { prisma } from "@/app/lib/prisma";

export const mothersRepository = {
  findAll() {
    return prisma.mothers.findMany({
      where: { is_deleted: false },
      orderBy: { created_at: "desc" },
    });
  },

  findByIdentity(identity_number: string, excludeId?: string) {
    return prisma.mothers.findFirst({
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
    return prisma.mothers.findFirst({
      where: {
        full_name_ar: data.full_name_ar,
        birth_date: data.birth_date ? new Date(data.birth_date) : null,
        is_deleted: false,
        id: data.excludeId ? { not: data.excludeId } : undefined,
      },
    });
  },

  create(data: any) {
    return prisma.mothers.create({ data });
  },

  update(id: string, data: any) {
    return prisma.mothers.update({
      where: { id },
      data,
    });
  },
};