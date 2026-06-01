import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/lib/api-error";
import { auditService } from "@/services/audit.service";
import { mothersRepository } from "@/repositories/mothers/mothers.repository";
import {
  createMotherSchema,
  updateMotherSchema,
  type CreateMotherInput,
  type UpdateMotherInput,
} from "@/validators/mothers/mother.schema";

function nextNumber(values: (string | null)[]) {
  const max = values
    .map((v) => Number(String(v || "").replace("M-", "").trim()))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => Math.max(a, b), 0);

  return `M-${String(max + 1).padStart(6, "0")}`;
}

async function getNextMotherCode() {
  const rows = await prisma.mothers.findMany({
    select: { mother_code: true },
  });

  return nextNumber(rows.map((x) => x.mother_code));
}

function mapMotherData(data: any) {
  return {
    branch_id: data.branch_id,

    full_name_ar: data.full_name_ar,
    full_name_en: data.full_name_en || null,

    identity_number: data.identity_number || null,
    birth_date: data.birth_date ? new Date(data.birth_date) : null,
    death_date: data.death_date ? new Date(data.death_date) : null,

    death_reason_id: data.death_reason_id || null,
    marital_status_id: data.marital_status_id || null,
    gender_id: data.gender_id || null,
    occupation_id: data.occupation_id || null,
    nationality_id: data.nationality_id || null,
    health_status_id: data.health_status_id || null,

    is_guardian: data.is_guardian ?? false,
    is_alive: data.is_alive ?? true,

    phone: data.phone || null,
    address: data.address || null,
    notes: data.notes || null,

    is_active: data.is_active ?? true,
    is_deleted: false,
  };
}

function validateDates(data: any) {
  if (data.death_reason_id && !data.death_date) {
    throw new AppError("يجب إدخال تاريخ الوفاة عند تحديد سبب الوفاة", 400);
  }

  if (
    data.birth_date &&
    data.death_date &&
    new Date(data.death_date) < new Date(data.birth_date)
  ) {
    throw new AppError("تاريخ الوفاة لا يمكن أن يكون قبل تاريخ الميلاد", 400);
  }

  if (data.is_alive && data.death_date) {
    throw new AppError("لا يمكن إدخال تاريخ وفاة والأم محددة أنها على قيد الحياة", 400);
  }
}

export const mothersService = {
  async listMothers() {
    return mothersRepository.findAll();
  },

  async getNextCode() {
    return {
      mother_code: await getNextMotherCode(),
    };
  },

  async createMother(input: CreateMotherInput) {
    const parsed = createMotherSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("خطأ في التحقق من البيانات", 400, parsed.error.flatten());
    }

    validateDates(parsed.data);

    if (parsed.data.identity_number) {
      const duplicateIdentity = await mothersRepository.findByIdentity(
        parsed.data.identity_number
      );

      if (duplicateIdentity) {
        throw new AppError("رقم هوية الأم موجود مسبقًا", 409);
      }
    }

    const duplicateSimilar = await mothersRepository.findSimilar({
      full_name_ar: parsed.data.full_name_ar,
      birth_date: parsed.data.birth_date || null,
    });

    if (duplicateSimilar) {
      throw new AppError("يوجد أم بنفس الاسم وتاريخ الميلاد", 409);
    }

    const mother_code = await getNextMotherCode();

    const mother = await mothersRepository.create({
      mother_code,
      ...mapMotherData(parsed.data),
    });

    await auditService.log({
      action: "CREATE",
      entityName: "mothers",
      entityId: mother.id,
      newData: mother,
      notes: "تم إنشاء سجل أم",
    });

    return mother;
  },

  async updateMother(input: UpdateMotherInput) {
    const parsed = updateMotherSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("خطأ في التحقق من البيانات", 400, parsed.error.flatten());
    }

    validateDates(parsed.data);

    const oldMother = await prisma.mothers.findUnique({
      where: { id: parsed.data.id },
    });

    if (!oldMother) {
      throw new AppError("سجل الأم غير موجود", 404);
    }

    if (parsed.data.identity_number) {
      const duplicateIdentity = await mothersRepository.findByIdentity(
        parsed.data.identity_number,
        parsed.data.id
      );

      if (duplicateIdentity) {
        throw new AppError("رقم هوية الأم موجود مسبقًا", 409);
      }
    }

    const duplicateSimilar = await mothersRepository.findSimilar({
      full_name_ar: parsed.data.full_name_ar,
      birth_date: parsed.data.birth_date || null,
      excludeId: parsed.data.id,
    });

    if (duplicateSimilar) {
      throw new AppError("يوجد أم بنفس الاسم وتاريخ الميلاد", 409);
    }

    const mother = await mothersRepository.update(parsed.data.id, {
      ...mapMotherData(parsed.data),
      updated_at: new Date(),
    });

    await auditService.log({
      action: "UPDATE",
      entityName: "mothers",
      entityId: mother.id,
      oldData: oldMother,
      newData: mother,
      notes: "تم تعديل سجل أم",
    });

    return mother;
  },

  async deleteMother(id: string) {
    if (!id) {
      throw new AppError("معرف الأم مطلوب", 400);
    }

    const oldMother = await prisma.mothers.findUnique({
      where: { id },
    });

    if (!oldMother) {
      throw new AppError("سجل الأم غير موجود", 404);
    }

    const mother = await mothersRepository.update(id, {
      is_deleted: true,
      is_active: false,
      updated_at: new Date(),
    });

    await auditService.log({
      action: "DELETE",
      entityName: "mothers",
      entityId: id,
      oldData: oldMother,
      notes: "تم حذف سجل أم حذفًا منطقيًا",
    });

    return mother;
  },
};