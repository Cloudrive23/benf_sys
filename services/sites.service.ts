import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/lib/api-error";
import { sitesRepository } from "@/repositories/sites.repository";
import {
  createSiteSchema,
  updateSiteSchema,
  type CreateSiteInput,
  type UpdateSiteInput,
} from "@/validators/site.schema";

function nextNumber(values: (string | null)[]) {
  const max = values
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => Math.max(a, b), 0);

  return String(max + 1);
}

async function getNextSiteCode() {
  const rows = await prisma.sites.findMany({
    select: { site_code: true },
  });

  return nextNumber(rows.map((x) => x.site_code));
}

export const sitesService = {
  async listSites() {
    return sitesRepository.findAll();
  },

  async getNextCode() {
    return { site_code: await getNextSiteCode() };
  },

  async createSite(input: CreateSiteInput) {
    const parsed = createSiteSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("خطأ في التحقق من البيانات", 400, parsed.error.flatten());
    }

    const duplicate = await sitesRepository.findDuplicateName(
      parsed.data.site_name_ar,
      parsed.data.branch_id
    );

    if (duplicate) {
      throw new AppError("اسم الموقع موجود مسبقًا داخل نفس الفرع", 409);
    }

    const site_code = parsed.data.site_code || (await getNextSiteCode());

    return sitesRepository.create({
      branch_id: parsed.data.branch_id,
      site_code,
      site_name_ar: parsed.data.site_name_ar,
      site_name_en: parsed.data.site_name_en || null,
      address: parsed.data.address || null,
      is_active: parsed.data.is_active ?? true,
    });
  },

  async updateSite(input: UpdateSiteInput) {
    const parsed = updateSiteSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("خطأ في التحقق من البيانات", 400, parsed.error.flatten());
    }

    const duplicate = await sitesRepository.findDuplicateName(
      parsed.data.site_name_ar,
      parsed.data.branch_id,
      parsed.data.id
    );

    if (duplicate) {
      throw new AppError("اسم الموقع موجود مسبقًا داخل نفس الفرع", 409);
    }

	const existing = await prisma.sites.findUnique({
			  where: {
				id: parsed.data.id,
			  },
			});

			if (!existing) {
			  throw new AppError("الموقع غير موجود", 404);
			}

			if (existing.branch_id !== parsed.data.branch_id) {
			  throw new AppError(
				"لا يمكن تغيير فرع الموقع بعد إنشائه حفاظًا على سلامة العلاقات",
				400
			  );
			}
    return sitesRepository.update(parsed.data.id, {
      branch_id: parsed.data.branch_id,
      site_name_ar: parsed.data.site_name_ar,
      site_name_en: parsed.data.site_name_en || null,
      address: parsed.data.address || null,
      is_active: parsed.data.is_active ?? true,
    });
  },

  async deleteSite(id: string) {
    if (!id) throw new AppError("معرف الموقع مطلوب", 400);
    return sitesRepository.delete(id);
  },
};