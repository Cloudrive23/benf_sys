import { prisma } from "@/app/lib/prisma";

export const familyMembersRepository = {
  findAll(beneficiaryId?: string) {
    return prisma.beneficiary_family_members.findMany({
      where: {
        ...(beneficiaryId ? { beneficiary_id: beneficiaryId } : {}),
        is_active: true,
      },
      orderBy: { created_at: "desc" },
    });
  },

  create(data: any) {
    return prisma.beneficiary_family_members.create({ data });
  },

  update(id: string, data: any) {
    return prisma.beneficiary_family_members.update({
      where: { id },
      data,
    });
  },
};