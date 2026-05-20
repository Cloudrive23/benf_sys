import { prisma } from "@/app/lib/prisma";

export const beneficiariesRepository = {
  findAll() {
    return prisma.beneficiaries.findMany({
      orderBy: {
        created_at: "desc",
      },
    });
  },

  findByCode(code: string) {
    return prisma.beneficiaries.findFirst({
      where: {
        beneficiary_code: code,
      },
    });
  },

  create(data: any) {
    return prisma.beneficiaries.create({
      data,
    });
  },

  update(id: string, data: any) {
    return prisma.beneficiaries.update({
      where: {
        id,
      },
      data,
    });
  },

  delete(id: string) {
    return prisma.beneficiaries.delete({
      where: {
        id,
      },
    });
  },
};
