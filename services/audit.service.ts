import { prisma } from "@/app/lib/prisma";

type AuditInput = {
  userId?: string | null;
  username?: string | null;

  action: string;

  entityName: string;
  entityType?: string | null;
  entityId?: string | null;

  titleAr?: string | null;
  descriptionAr?: string | null;

  oldData?: unknown;
  newData?: unknown;

  ipAddress?: string | null;
  userAgent?: string | null;
  notes?: string | null;
};

export const auditService = {
  async log(input: AuditInput) {
    try {
      await prisma.audit_logs.create({
        data: {
          user_id: input.userId || null,
          username: input.username || null,

          action: input.action,

          entity_name: input.entityName,
          entity_type: input.entityType || input.entityName,
          entity_id: input.entityId || null,

          title_ar: input.titleAr || null,
          description_ar: input.descriptionAr || null,

          old_data: input.oldData
            ? JSON.parse(JSON.stringify(input.oldData))
            : undefined,

          new_data: input.newData
            ? JSON.parse(JSON.stringify(input.newData))
            : undefined,

          ip_address: input.ipAddress || null,
          user_agent: input.userAgent || null,
          notes: input.notes || null,
        },
      });
    } catch (error) {
      console.error("Audit log failed:", error);
    }
  },
};