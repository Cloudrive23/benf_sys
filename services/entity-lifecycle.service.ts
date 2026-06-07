import { AppError } from "@/lib/api-error";
import {
  logCreate,
  logDelete,
  logUpdate,
} from "@/lib/audit/audit-logger";
import { duplicateCheckService } from "@/services/duplicate-check.service";

type Actor = {
  id?: string;
  username?: string;
  role?: string;
} | null;

type DuplicatePolicyResult = Awaited<
  ReturnType<typeof duplicateCheckService.check>
>;

type BeforeCreateInput = {
  entityKey: string;
  data: Record<string, any>;
  allowDuplicateWarning?: boolean;
};

type BeforeUpdateInput = {
  entityKey: string;
  data: Record<string, any>;
  excludeId: string;
  allowDuplicateWarning?: boolean;
};

type AfterCreateInput = {
  entityKey: string;
  entityId: string;
  data: any;
  actor?: Actor;
};

type AfterUpdateInput = {
  entityKey: string;
  entityId: string;
  oldData: any;
  newData: any;
  actor?: Actor;
};

type AfterDeleteInput = {
  entityKey: string;
  entityId: string;
  oldData: any;
  newData?: any;
  actor?: Actor;
};

async function validateDuplicatePolicy({
  entityKey,
  data,
  excludeId,
  allowDuplicateWarning = false,
}: {
  entityKey: string;
  data: Record<string, any>;
  excludeId?: string;
  allowDuplicateWarning?: boolean;
}): Promise<DuplicatePolicyResult> {
  const result = await duplicateCheckService.check({
    entityKey,
    data,
    excludeId,
  });

  if (result.actionMode === "block") {
    const firstMatch = result.matches[0];

    throw new AppError(
      firstMatch?.message || "يوجد سجل مشابه ولا يمكن الحفظ حسب سياسة التكرار",
      409,
      {
        ...result,
        requiresConfirmation: false,
      }
    );
  }

  if (result.actionMode === "warn" && !allowDuplicateWarning) {
    const firstMatch = result.matches[0];

    throw new AppError(
      firstMatch?.message || "يوجد سجل مشابه، يرجى التأكد قبل الحفظ",
      409,
      {
        ...result,
        requiresConfirmation: true,
      }
    );
  }

  return result;
}

export const entityLifecycleService = {
  async beforeCreate(input: BeforeCreateInput) {
    return validateDuplicatePolicy({
      entityKey: input.entityKey,
      data: input.data,
      allowDuplicateWarning: input.allowDuplicateWarning,
    });
  },

  async beforeUpdate(input: BeforeUpdateInput) {
    return validateDuplicatePolicy({
      entityKey: input.entityKey,
      data: input.data,
      excludeId: input.excludeId,
      allowDuplicateWarning: input.allowDuplicateWarning,
    });
  },

  async afterCreate(input: AfterCreateInput) {
    await logCreate({
      entityKey: input.entityKey,
      entityId: input.entityId,
      data: input.data,
      actor: input.actor,
    });
  },

  async afterUpdate(input: AfterUpdateInput) {
    await logUpdate({
      entityKey: input.entityKey,
      entityId: input.entityId,
      oldData: input.oldData,
      newData: input.newData,
      actor: input.actor,
    });
  },

  async afterDelete(input: AfterDeleteInput) {
    await logDelete({
      entityKey: input.entityKey,
      entityId: input.entityId,
      oldData: input.oldData,
      newData: input.newData,
      actor: input.actor,
    });
  },
};