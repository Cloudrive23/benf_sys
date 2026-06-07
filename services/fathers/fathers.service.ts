import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/lib/api-error";
import { entityLifecycleService } from "@/services/entity-lifecycle.service";
import { fathersRepository } from "@/repositories/fathers/fathers.repository";
import {
  createFatherSchema,
  updateFatherSchema,
  type CreateFatherInput,
  type UpdateFatherInput,
} from "@/validators/fathers/father.schema";

type Actor = {
  id?: string;
  username?: string;
  role?: string;
} | null;

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

/**
 * تحقق قديم من رقم الهوية.
 *
 * أوقفناه هنا حتى تكون سياسات التكرار كلها من لوحة التحكم.
 * لتفعيل منع رقم الهوية، الأفضل إضافة سياسة من صفحة:
 * /duplicate-rules
 *
 * مثال:
 * الكيان: الأب
 * الحقل: identity_number
 * نوع المطابقة: رقم هوية
 * الإجراء: منع الحفظ
 * النطاق: النظام كامل
 */
async function ensureUniqueFatherIdentity(
  identityNumber?: string | null,
  excludeId?: string
) {
  if (!identityNumber) return;

  const duplicateIdentity = await fathersRepository.findByIdentity(
    identityNumber,
    excludeId
  );

  if (duplicateIdentity) {
    throw new AppError("رقم هوية الأب موجود مسبقًا", 409);
  }
}

/**
 * تحقق قديم من التشابه.
 *
 * أوقفناه حتى يتم التحكم بالتشابه من لوحة سياسات التكرار.
 */
async function ensureNoSimilarFather(data: any, excludeId?: string) {
  const duplicateSimilar = await fathersRepository.findSimilar({
    full_name_ar: data.full_name_ar,
    death_date: data.death_date || null,
    death_reason_id: data.death_reason_id || null,
    excludeId,
  });

  if (duplicateSimilar) {
    throw new AppError("يوجد أب بنفس الاسم وتاريخ الوفاة وسبب الوفاة", 409);
  }
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

  async createFather(
    input: CreateFatherInput,
    actor?: Actor,
    allowDuplicateWarning = false
  ) {
    const parsed = createFatherSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError(
        "خطأ في التحقق من البيانات",
        400,
        parsed.error.flatten()
      );
    }

    /**
     * التحقق القديم من رقم الهوية - موقوف.
     * الأفضل إدارته من لوحة سياسات التكرار.
     */
    // await ensureUniqueFatherIdentity(parsed.data.identity_number);

    /**
     * التحقق القديم من التشابه - موقوف.
     * الأفضل إدارته من لوحة سياسات التكرار.
     */
    // await ensureNoSimilarFather(parsed.data);

    await entityLifecycleService.beforeCreate({
      entityKey: "father",
      data: parsed.data,
      allowDuplicateWarning,
    });

    const father_code = await getNextFatherCode();

    const father = await fathersRepository.create({
      father_code,
      ...mapFatherData(parsed.data),
    });

    await entityLifecycleService.afterCreate({
      entityKey: "father",
      entityId: father.id,
      data: father,
      actor,
    });

    return father;
  },

  async updateFather(
    input: UpdateFatherInput,
    actor?: Actor,
    allowDuplicateWarning = false
  ) {
    const parsed = updateFatherSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError(
        "خطأ في التحقق من البيانات",
        400,
        parsed.error.flatten()
      );
    }

    const oldFather = await prisma.fathers.findUnique({
      where: {
        id: parsed.data.id,
      },
    });

    if (!oldFather) {
      throw new AppError("سجل الأب غير موجود", 404);
    }

    /**
     * التحقق القديم من رقم الهوية - موقوف.
     * الأفضل إدارته من لوحة سياسات التكرار.
     */
    // await ensureUniqueFatherIdentity(
    //   parsed.data.identity_number,
    //   parsed.data.id
    // );

    /**
     * التحقق القديم من التشابه - موقوف.
     * الأفضل إدارته من لوحة سياسات التكرار.
     */
    // await ensureNoSimilarFather(parsed.data, parsed.data.id);

    await entityLifecycleService.beforeUpdate({
      entityKey: "father",
      data: parsed.data,
      excludeId: parsed.data.id,
      allowDuplicateWarning,
    });

    const father = await fathersRepository.update(parsed.data.id, {
      ...mapFatherData(parsed.data),
      updated_at: new Date(),
    });

    await entityLifecycleService.afterUpdate({
      entityKey: "father",
      entityId: father.id,
      oldData: oldFather,
      newData: father,
      actor,
    });

    return father;
  },

  async deleteFather(id: string, actor?: Actor) {
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

    await entityLifecycleService.afterDelete({
      entityKey: "father",
      entityId: father.id,
      oldData: oldFather,
      newData: father,
      actor,
    });

    return father;
  },
};