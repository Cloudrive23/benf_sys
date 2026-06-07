import { prisma } from "@/app/lib/prisma";

const sponsorshipInclude = {
  beneficiaries: {
    select: {
      id: true,
      beneficiary_code: true,
      file_number: true,
      full_name: true,
      identity_number: true,
      phone: true,
      is_active: true,
    },
  },
  sponsors: {
    select: {
      id: true,
      sponsor_code: true,
      sponsor_name: true,
      sponsor_type: true,
      parent_sponsor_id: true,
      is_active: true,
      sponsors: {
        select: {
          id: true,
          sponsor_code: true,
          sponsor_name: true,
        },
      },
    },
  },
};

function normalizeSearch(value: string) {
  return String(value || "").trim();
}

export const sponsorshipsRepository = {
  findAll() {
    return prisma.sponsorships.findMany({
      include: sponsorshipInclude,
      orderBy: [{ created_at: "desc" }, { sponsorship_code: "desc" }],
    });
  },

  findById(id: string) {
    return prisma.sponsorships.findUnique({
      where: { id },
      include: sponsorshipInclude,
    });
  },

  findByCode(code: string) {
    return prisma.sponsorships.findFirst({
      where: { sponsorship_code: code },
    });
  },

  findBeneficiaryById(id: string) {
    return prisma.beneficiaries.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      select: {
        id: true,
        beneficiary_code: true,
        file_number: true,
        full_name: true,
        identity_number: true,
        phone: true,
        is_active: true,
      },
    });
  },

  searchBeneficiaries(query: string, take = 25) {
    const q = normalizeSearch(query);

    if (!q) {
      return prisma.beneficiaries.findMany({
        where: {
          deleted_at: null,
          is_active: true,
        },
        select: {
          id: true,
          beneficiary_code: true,
          file_number: true,
          full_name: true,
          identity_number: true,
          phone: true,
          is_active: true,
        },
        orderBy: [{ created_at: "desc" }],
        take: Math.min(Math.max(take, 1), 50),
      });
    }

    return prisma.beneficiaries.findMany({
      where: {
        deleted_at: null,
        is_active: true,
        OR: [
          { full_name: { contains: q } },
          { beneficiary_code: { contains: q } },
          { file_number: { contains: q } },
          { identity_number: { contains: q } },
          { phone: { contains: q } },
        ],
      },
      select: {
        id: true,
        beneficiary_code: true,
        file_number: true,
        full_name: true,
        identity_number: true,
        phone: true,
        is_active: true,
      },
      orderBy: [{ full_name: "asc" }],
      take: Math.min(Math.max(take, 1), 50),
    });
  },

  findSponsorById(id: string) {
    return prisma.sponsors.findUnique({
      where: { id },
      select: {
        id: true,
        sponsor_code: true,
        sponsor_name: true,
        parent_sponsor_id: true,
        is_active: true,
        sponsors: {
          select: {
            id: true,
            sponsor_code: true,
            sponsor_name: true,
          },
        },
      },
    });
  },

  searchParentSponsors(query: string, take = 50) {
    const q = normalizeSearch(query);

    return prisma.sponsors.findMany({
      where: {
        parent_sponsor_id: null,
        is_active: true,
        ...(q
          ? {
              OR: [
                { sponsor_name: { contains: q } },
                { sponsor_code: { contains: q } },
                { phone: { contains: q } },
                { contact_person: { contains: q } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        sponsor_code: true,
        sponsor_name: true,
        sponsor_type: true,
        parent_sponsor_id: true,
        is_active: true,
      },
      orderBy: [{ sponsor_name: "asc" }],
      take: Math.min(Math.max(take, 1), 100),
    });
  },

  searchChildSponsors(parentId: string, query: string, take = 50) {
    const q = normalizeSearch(query);

    return prisma.sponsors.findMany({
      where: {
        parent_sponsor_id: parentId,
        is_active: true,
        ...(q
          ? {
              OR: [
                { sponsor_name: { contains: q } },
                { sponsor_code: { contains: q } },
                { phone: { contains: q } },
                { contact_person: { contains: q } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        sponsor_code: true,
        sponsor_name: true,
        sponsor_type: true,
        parent_sponsor_id: true,
        is_active: true,
        sponsors: {
          select: {
            id: true,
            sponsor_code: true,
            sponsor_name: true,
          },
        },
      },
      orderBy: [{ sponsor_name: "asc" }],
      take: Math.min(Math.max(take, 1), 100),
    });
  },

  findActiveLookupByCode(lookupType: string, code: string) {
    return prisma.lookups.findFirst({
      where: {
        lookup_type: lookupType,
        code,
        is_active: true,
        is_deleted: false,
      },
      select: {
        id: true,
        code: true,
        name_ar: true,
      },
    });
  },

  findCodes() {
    return prisma.sponsorships.findMany({
      select: {
        sponsorship_code: true,
      },
    });
  },

  create(data: any, historyData?: any) {
    return prisma.$transaction(async (tx) => {
      const sponsorship = await tx.sponsorships.create({
        data,
      });

      if (historyData) {
        await tx.sponsorship_status_history.create({
          data: {
            ...historyData,
            sponsorship_id: sponsorship.id,
          },
        });
      }

      return tx.sponsorships.findUnique({
        where: { id: sponsorship.id },
        include: sponsorshipInclude,
      });
    });
  },

  update(id: string, data: any, historyData?: any) {
    return prisma.$transaction(async (tx) => {
      const sponsorship = await tx.sponsorships.update({
        where: { id },
        data,
      });

      if (historyData) {
        await tx.sponsorship_status_history.create({
          data: {
            ...historyData,
            sponsorship_id: sponsorship.id,
          },
        });
      }

      return tx.sponsorships.findUnique({
        where: { id: sponsorship.id },
        include: sponsorshipInclude,
      });
    });
  },

  delete(id: string) {
    return prisma.sponsorships.delete({
      where: { id },
    });
  },
};
