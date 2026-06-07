import { prisma } from "@/app/lib/prisma";

export const sponsorsRepository = {
  findAll() {
    return prisma.sponsors.findMany({
      include: {
        sponsors: {
          select: {
            id: true,
            sponsor_code: true,
            sponsor_name: true,
          },
        },
        _count: {
          select: {
            other_sponsors: true,
            sponsorships: true,
          },
        },
      },
      orderBy: [
        { parent_sponsor_id: "asc" },
        { sponsor_name: "asc" },
      ],
    });
  },

  findActive() {
    return prisma.sponsors.findMany({
      where: {
        is_active: true,
      },
      select: {
        id: true,
        sponsor_code: true,
        sponsor_name: true,
        sponsor_type: true,
        parent_sponsor_id: true,
        is_active: true,
      },
      orderBy: {
        sponsor_name: "asc",
      },
    });
  },

  findById(id: string) {
    return prisma.sponsors.findUnique({
      where: { id },
      include: {
        sponsors: {
          select: {
            id: true,
            sponsor_code: true,
            sponsor_name: true,
          },
        },
        _count: {
          select: {
            other_sponsors: true,
            sponsorships: true,
          },
        },
      },
    });
  },

  findByCode(code: string) {
    return prisma.sponsors.findFirst({
      where: {
        sponsor_code: code,
      },
    });
  },

  findChildren(parentId: string) {
    return prisma.sponsors.findMany({
      where: {
        parent_sponsor_id: parentId,
      },
      select: {
        id: true,
      },
      take: 1,
    });
  },

  findChildrenByParentIds(parentIds: string[]) {
    if (parentIds.length === 0) return Promise.resolve([]);

    return prisma.sponsors.findMany({
      where: {
        parent_sponsor_id: {
          in: parentIds,
        },
      },
      select: {
        id: true,
      },
    });
  },

  findLinkedSponsorships(sponsorId: string) {
    return prisma.sponsorships.findMany({
      where: {
        sponsor_id: sponsorId,
      },
      select: {
        id: true,
      },
      take: 1,
    });
  },

  create(data: any) {
    return prisma.sponsors.create({
      data,
    });
  },

  async createParentWithDefaultChild(parentData: any, childData: any) {
    return prisma.$transaction(async (tx) => {
      const parent = await tx.sponsors.create({
        data: parentData,
      });

      await tx.sponsors.create({
        data: {
          ...childData,
          parent_sponsor_id: parent.id,
        },
      });

      return tx.sponsors.findUnique({
        where: { id: parent.id },
        include: {
          sponsors: {
            select: {
              id: true,
              sponsor_code: true,
              sponsor_name: true,
            },
          },
          _count: {
            select: {
              other_sponsors: true,
              sponsorships: true,
            },
          },
        },
      });
    });
  },

  update(id: string, data: any) {
    return prisma.sponsors.update({
      where: { id },
      data,
    });
  },

  deactivateMany(ids: string[], updatedBy?: string | null) {
    if (ids.length === 0) {
      return Promise.resolve({ count: 0 });
    }

    return prisma.sponsors.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        is_active: false,
        updated_by: updatedBy || null,
        updated_at: new Date(),
      },
    });
  },

  delete(id: string) {
    return prisma.sponsors.delete({
      where: { id },
    });
  },
};
