import { auditLogRepository } from "@/repositories/audit-log.repository";

export const auditLogService = {
  async log({
    entityType,
    entityId,
    action,
    title,
    description,
    oldValues,
    newValues,
    username,
    userId,
  }: any) {
    return auditLogRepository.create({
      entity_type: entityType,
      entity_name: entityType,

      entity_id: entityId,

      action,

      title_ar: title,
      description_ar: description,

      old_data: oldValues || null,
      new_data: newValues || null,

	  username: null,
                  userId: null,
    });
  },
};