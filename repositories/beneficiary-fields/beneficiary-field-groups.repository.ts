import { prisma } from "@/app/lib/prisma";

export const beneficiaryFieldGroupsRepository = {
  findAll() {
  return prisma.beneficiary_field_groups.findMany({
    include: {
      tab: true,
    },
    orderBy: [
      { sort_order: "asc" }
    ],
  });
},

  create(data: any) {
    return prisma.beneficiary_field_groups.create({ data });
  },

  update(id: string, data: any) {
    return prisma.beneficiary_field_groups.update({
      where: { id },
      data,
    });
  },
};