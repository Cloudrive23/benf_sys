import { prisma } from "@/app/lib/prisma";

export const branchesRepository = {
  findAll() {
    return prisma.branches.findMany({
      orderBy: {
        created_at: "desc",
      },
    });
  },

  findByCode(branch_code: string) {
    return prisma.branches.findFirst({
      where: {
        branch_code,
      },
    });
  },

  findDuplicateName(branch_name_ar: string, excludeId?: string) {
    return prisma.branches.findFirst({
      where: {
        branch_name_ar,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
  },

  create(data: any) {
    return prisma.branches.create({
      data,
    });
  },

  update(id: string, data: any) {
    return prisma.branches.update({
      where: { id },
      data,
    });
  },

  delete(id: string) {
    return prisma.branches.delete({
      where: { id },
    });
  },
};
