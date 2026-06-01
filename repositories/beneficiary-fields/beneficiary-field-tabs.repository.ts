import { prisma } from "@/app/lib/prisma";

export const beneficiaryFieldTabsRepository = {
  findAll() {
    return prisma.beneficiary_field_tabs.findMany({
      orderBy: { sort_order: "asc" },
    });
  },

  create(data: any) {
    return prisma.beneficiary_field_tabs.create({ data });
  },

  update(id: string, data: any) {
    return prisma.beneficiary_field_tabs.update({
      where: { id },
      data,
    });
  },
};