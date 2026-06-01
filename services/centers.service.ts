import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/lib/api-error";
import { centersRepository } from "@/repositories/centers.repository";
import {
  createCenterSchema,
  updateCenterSchema,
  type CreateCenterInput,
  type UpdateCenterInput,
} from "@/validators/center.schema";

function nextNumber(values: (string | null)[]) {
  const max = values
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => Math.max(a, b), 0);

  return String(max + 1);
}

async function getNextCenterCode() {
  const rows = await prisma.centers.findMany({
    select: { center_code: true },
  });

  return nextNumber(rows.map((x) => x.center_code));
}

export const centersService = {
  async listCenters() {
    return centersRepository.findAll();
  },

  async getNextCode() {
    return { center_code: await getNextCenterCode() };
  },

  async createCenter(input: CreateCenterInput) {
    const parsed = createCenterSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("خطأ في التحقق من البيانات", 400, parsed.error.flatten());
    }

    const duplicate = await centersRepository.findDuplicateName(
      parsed.data.center_name_ar,
      parsed.data.site_id
    );

    if (duplicate) {
      throw new AppError("اسم المركز موجود مسبقًا داخل نفس الموقع", 409);
    }

    const center_code = parsed.data.center_code || (await getNextCenterCode());

    return centersRepository.create({
      branch_id: parsed.data.branch_id,
      site_id: parsed.data.site_id,
      center_code,
      center_name_ar: parsed.data.center_name_ar,
      center_name_en: parsed.data.center_name_en || null,
      address: parsed.data.address || null,
      is_active: parsed.data.is_active ?? true,
    });
  },

  async updateCenter(input: UpdateCenterInput) {
    const parsed = updateCenterSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("خطأ في التحقق من البيانات", 400, parsed.error.flatten());
    }

    const duplicate = await centersRepository.findDuplicateName(
      parsed.data.center_name_ar,
      parsed.data.site_id,
      parsed.data.id
    );

    if (duplicate) {
      throw new AppError("اسم المركز موجود مسبقًا داخل نفس الموقع", 409);
    }

    return centersRepository.update(parsed.data.id, {
      branch_id: parsed.data.branch_id,
      site_id: parsed.data.site_id,
      center_name_ar: parsed.data.center_name_ar,
      center_name_en: parsed.data.center_name_en || null,
      address: parsed.data.address || null,
      is_active: parsed.data.is_active ?? true,
    });
  },

  async deleteCenter(id: string) {
    if (!id) throw new AppError("معرف المركز مطلوب", 400);
    return centersRepository.delete(id);
  },
};