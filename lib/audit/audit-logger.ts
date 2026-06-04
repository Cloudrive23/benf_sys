import { buildAuditDiff } from "@/lib/audit/audit-diff";
import { getAuditEntityConfig } from "@/lib/audit/audit-registry";
import { auditService } from "@/services/audit.service";
import { auditConfigRepository } from "@/repositories/audit-config.repository";

type Actor = {
  id?: string;
  username?: string;
  role?: string;
} | null;

type LogCreateInput = {
  entityKey: string;
  entityId: string;
  data: any;
  actor?: Actor;
  displayName?: string | null;
};

type LogUpdateInput = {
  entityKey: string;
  entityId: string;
  oldData: any;
  newData: any;
  actor?: Actor;
  displayName?: string | null;
};

type LogDeleteInput = {
  entityKey: string;
  entityId: string;
  oldData: any;
  newData?: any;
  actor?: Actor;
  displayName?: string | null;
};

async function getConfig(entityKey: string) {
  const dbConfig = await auditConfigRepository.findByEntityKey(entityKey);

  if (dbConfig) {
    return dbConfig;
  }

  return getAuditEntityConfig(entityKey);
}

function getDisplayName(config: any, data: any, fallback?: string | null) {
  if (fallback) return fallback;

  if (config.displayNameField && data?.[config.displayNameField]) {
    return data[config.displayNameField];
  }

  return data?.name_ar || data?.full_name_ar || data?.full_name || data?.id || "";
}

export async function logCreate(input: LogCreateInput) {
  const config = await getConfig(input.entityKey);
  const displayName = getDisplayName(config, input.data, input.displayName);

  await auditService.log({
    userId: input.actor?.id || null,
    username: input.actor?.username || null,
    action: "CREATE",
    entityName: config.entityName,
    entityType: config.entityType,
    entityId: input.entityId,
    titleAr: `إضافة ${config.label}`,
    descriptionAr: `تمت إضافة ${config.label}: ${displayName}`,
    newData: input.data,
    notes: JSON.stringify({
      message: `تمت إضافة ${config.label}`,
      changes: [],
    }),
  });
}

export async function logUpdate(input: LogUpdateInput) {
  const config = await getConfig(input.entityKey);
  const displayName = getDisplayName(config, input.newData, input.displayName);

  const diff = buildAuditDiff({
    oldData: input.oldData,
    newData: input.newData,
    fields: config.fields,
  });

  if (!diff.hasChanges) return;

  await auditService.log({
    userId: input.actor?.id || null,
    username: input.actor?.username || null,
    action: "UPDATE",
    entityName: config.entityName,
    entityType: config.entityType,
    entityId: input.entityId,
    titleAr:
      diff.changes.length === 1
        ? `تعديل ${diff.changedText}`
        : `تعديل بيانات ${config.label}`,
    descriptionAr: `تم تعديل ${diff.changedText} لـ ${config.label}: ${displayName}`,
    oldData: input.oldData,
    newData: input.newData,
    notes: JSON.stringify({
      message: `تم تعديل ${config.label}`,
      changes: diff.changes,
    }),
  });
}

export async function logDelete(input: LogDeleteInput) {
  const config = await getConfig(input.entityKey);
  const displayName = getDisplayName(
    config,
    input.newData || input.oldData,
    input.displayName
  );

  await auditService.log({
    userId: input.actor?.id || null,
    username: input.actor?.username || null,
    action: "DELETE",
    entityName: config.entityName,
    entityType: config.entityType,
    entityId: input.entityId,
    titleAr: `حذف ${config.label}`,
    descriptionAr: `تم حذف ${config.label}: ${displayName}`,
    oldData: input.oldData,
    newData: input.newData,
    notes: JSON.stringify({
      message: `تم حذف ${config.label}`,
      changes: [],
    }),
  });
}