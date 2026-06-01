import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/lib/api-error";
import { auditService } from "@/services/audit.service";
import { fathersRepository } from "@/repositories/fathers/fathers.repository";
import {
  createFatherSchema,
  updateFatherSchema,
  type CreateFatherInput,
  type UpdateFatherInput,
} from "@/validators/fathers/father.schema";

function nextNumber(values: (string | null)[]) {
  const max = values
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => Math.max(a, b), 0);

  return String(max + 1);
}

async function getNextFatherCode() {
  const rows = await prisma.fathers.findMany({
    select: {
      father_code: true,
    },
  });

  return nextNumber(rows.map((x) => x.father_code));
}

function mapFatherData(data: any) {
  return {
    branch_id: data.branch_id,

    full_name_ar: data.full_name_ar,
    full_name_en: data.full_name_en || null,

    identity_number: data.identity_number || null,

    birth_date: data.birth_date ? new Date(data.birth_date) : null,
    death_date: data.death_date ? new Date(data.death_date) : null,

    death_reason_id: data.death_reason_id || null,

    phone: data.phone || null,
    address: data.address || null,
    occupation: data.occupation || null,
	occupation_id: data.occupation_id || null,

    notes: data.notes || null,

    is_active: data.is_active ?? true,
    is_deleted: false,
  };
}

export const fathersService = {
  async listFathers() {
    return fathersRepository.findAll();
  },

  async getNextCode() {
    return {
      father_code: await getNextFatherCode(),
    };
  },

  async createFather(input: CreateFatherInput) {
    const parsed = createFatherSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("خطأ في التحقق من البيانات", 400, parsed.error.flatten());
    }

    if (parsed.data.identity_number) {
      const duplicateIdentity = await fathersRepository.findByIdentity(
        parsed.data.identity_number
      );

      if (duplicateIdentity) {
        throw new AppError("رقم هوية الأب موجود مسبقًا", 409);
      }
    }

    const duplicateSimilar = await fathersRepository.findSimilar({
      full_name_ar: parsed.data.full_name_ar,
      death_date: parsed.data.death_date || null,
      death_reason_id: parsed.data.death_reason_id || null,
    });

    if (duplicateSimilar) {
      throw new AppError("يوجد أب بنفس الاسم وتاريخ الوفاة وسبب الوفاة", 409);
    }

    const father_code = await getNextFatherCode();

    const father = await fathersRepository.create({
      father_code,
      ...mapFatherData(parsed.data),
    });

    await auditService.log({
      action: "CREATE",
      entityName: "fathers",
      entityId: father.id,
      newData: father,
      notes: "تم إنشاء سجل أب",
    });

    return father;
  },

  async updateFather(input: UpdateFatherInput) {
    const parsed = updateFatherSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("خطأ في التحقق من البيانات", 400, parsed.error.flatten());
    }

    const oldFather = await prisma.fathers.findUnique({
      where: {
        id: parsed.data.id,
      },
    });

    if (!oldFather) {
      throw new AppError("سجل الأب غير موجود", 404);
    }

    if (parsed.data.identity_number) {
      const duplicateIdentity = await fathersRepository.findByIdentity(
        parsed.data.identity_number,
        parsed.data.id
      );

      if (duplicateIdentity) {
        throw new AppError("رقم هوية الأب موجود مسبقًا", 409);
      }
    }

    const duplicateSimilar = await fathersRepository.findSimilar({
      full_name_ar: parsed.data.full_name_ar,
      death_date: parsed.data.death_date || null,
      death_reason_id: parsed.data.death_reason_id || null,
      excludeId: parsed.data.id,
    });

    if (duplicateSimilar) {
      throw new AppError("يوجد أب بنفس الاسم وتاريخ الوفاة وسبب الوفاة", 409);
    }

    const father = await fathersRepository.update(parsed.data.id, {
      ...mapFatherData(parsed.data),
      updated_at: new Date(),
    });

    await auditService.log({
      action: "UPDATE",
      entityName: "fathers",
      entityId: father.id,
      oldData: oldFather,
      newData: father,
      notes: "تم تعديل سجل أب",
    });

    return father;
  },

  async deleteFather(id: string) {
    if (!id) {
      throw new AppError("معرف الأب مطلوب", 400);
    }

    const oldFather = await prisma.fathers.findUnique({
      where: {
        id,
      },
    });

    if (!oldFather) {
      throw new AppError("سجل الأب غير موجود", 404);
    }

    const father = await fathersRepository.update(id, {
      is_deleted: true,
      is_active: false,
      updated_at: new Date(),
    });

    await auditService.log({
      action: "DELETE",
      entityName: "fathers",
      entityId: id,
      oldData: oldFather,
      notes: "تم حذف سجل أب حذفًا منطقيًا",
    });

    return father;
  },
};