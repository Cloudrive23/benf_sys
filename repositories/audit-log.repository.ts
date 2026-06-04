import { prisma } from "@/app/lib/prisma";

export const auditLogRepository = {
  create(data: any) {
    return prisma.audit_logs.create({
      data,
    });
  },

  findByEntity(
    entityType: string,
    entityId: string
  ) {
    return prisma.audit_logs.findMany({
      where: {
        entity_type: entityType,
        entity_id: entityId,
      },
      orderBy: {
        created_at: "desc",
      },
    });
  },


findRecent(limit = 100) {
  return prisma.audit_logs.findMany({
    orderBy: {
      created_at: "desc",
    },
    take: limit,
  });
},
};