import { prisma } from "@/app/lib/prisma";

export const fathersRepository = {
  findAll() {
    return prisma.fathers.findMany({
      where: {
        is_deleted: false,
      },
      orderBy: {
        created_at: "desc",
      },
    });
  },

  findByIdentity(identity_number: string, excludeId?: string) {
    return prisma.fathers.findFirst({
      where: {
        identity_number,
        is_deleted: false,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
  },

  findSimilar(data: {
    full_name_ar: string;
    death_date?: string | null;
    death_reason_id?: string | null;
    excludeId?: string;
  }) {
    return prisma.fathers.findFirst({
      where: {
        full_name_ar: data.full_name_ar,
        death_date: data.death_date ? new Date(data.death_date) : null,
        death_reason_id: data.death_reason_id || null,
        is_deleted: false,
        id: data.excludeId ? { not: data.excludeId } : undefined,
      },
    });
  },

  create(data: any) {
    return prisma.fathers.create({ data });
  },

  update(id: string, data: any) {
    return prisma.fathers.update({
      where: { id },
      data,
    });
  },
};