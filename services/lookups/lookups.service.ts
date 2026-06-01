import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/lib/api-error";
import { auditService } from "@/services/audit.service";

import {
  createLookupSchema,
  updateLookupSchema,
} from "@/validators/lookups/lookup.schema";

import { lookupsRepository } from "@/repositories/lookups/lookups.repository";

function nextNumber(values: (string | null)[]) {
  const max = values
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => Math.max(a, b), 0);

  return String(max + 1);
}

async function getNextLookupCode(lookupType: string) {
  const rows = await prisma.lookups.findMany({
    where: {
      lookup_type: lookupType,
    },
    select: {
      code: true,
    },
  });

  return nextNumber(rows.map((x) => x.code));
}

export const lookupsService = {
  async list(type: string) {
    return lookupsRepository.findAll(type);
  },

  async create(input: any) {
    const parsed = createLookupSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("بيانات غير صحيحة", 400);
    }

    const duplicate = await lookupsRepository.findDuplicate(
      parsed.data.lookup_type,
      parsed.data.name_ar
    );

    if (duplicate) {
      throw new AppError("القيمة موجودة مسبقًا", 409);
    }

    const code = await getNextLookupCode(parsed.data.lookup_type);

    const item = await lookupsRepository.create({
      lookup_type: parsed.data.lookup_type,
      code,
      name_ar: parsed.data.name_ar,
      name_en: parsed.data.name_en || null,
      notes: parsed.data.notes || null,
      sort_order: parsed.data.sort_order || 0,
      is_active: parsed.data.is_active ?? true,
      is_deleted: false,
    });

    await auditService.log({
      action: "CREATE",
      entityName: "lookups",
      entityId: item.id,
      newData: item,
      notes: `تم إنشاء ${parsed.data.lookup_type}`,
    });

    return item;
  },

  async update(input: any) {
    const parsed = updateLookupSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("بيانات غير صحيحة", 400);
    }

    const duplicate = await lookupsRepository.findDuplicate(
      parsed.data.lookup_type,
      parsed.data.name_ar,
      parsed.data.id
    );

    if (duplicate) {
      throw new AppError("القيمة موجودة مسبقًا", 409);
    }

    const oldItem = await prisma.lookups.findUnique({
      where: {
        id: parsed.data.id,
      },
    });

    if (!oldItem) {
      throw new AppError("السجل غير موجود", 404);
    }

    const item = await lookupsRepository.update(parsed.data.id, {
      // لا نعدّل الكود نهائيًا
      name_ar: parsed.data.name_ar,
      name_en: parsed.data.name_en || null,
      notes: parsed.data.notes || null,
      sort_order: parsed.data.sort_order || 0,
      is_active: parsed.data.is_active ?? true,
    });

    await auditService.log({
      action: "UPDATE",
      entityName: "lookups",
      entityId: item.id,
      oldData: oldItem,
      newData: item,
      notes: `تم تعديل ${parsed.data.lookup_type}`,
    });

    return item;
  },

  async delete(id: string) {
    if (!id) {
      throw new AppError("معرف السجل مطلوب", 400);
    }

    const oldItem = await prisma.lookups.findUnique({
      where: {
        id,
      },
    });

    if (!oldItem) {
      throw new AppError("السجل غير موجود", 404);
    }

    const item = await lookupsRepository.update(id, {
      is_deleted: true,
      is_active: false,
    });

    await auditService.log({
      action: "DELETE",
      entityName: "lookups",
      entityId: id,
      oldData: oldItem,
      notes: "تم حذف قيمة مرجعية",
    });

    return item;
  },
};