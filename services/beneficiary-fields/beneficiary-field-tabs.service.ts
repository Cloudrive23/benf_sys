import { AppError } from "@/lib/api-error";
import { beneficiaryFieldTabsRepository } from "@/repositories/beneficiary-fields/beneficiary-field-tabs.repository";

export const beneficiaryFieldTabsService = {
  async list() {
    return beneficiaryFieldTabsRepository.findAll();
  },

  async create(input: any) {
    if (!input.tab_code || !input.tab_name_ar) {
      throw new AppError("كود واسم التبويب مطلوبان", 400);
    }

    return beneficiaryFieldTabsRepository.create({
      tab_code: input.tab_code,
      tab_name_ar: input.tab_name_ar,
      tab_name_en: input.tab_name_en || null,
      sort_order: Number(input.sort_order || 0),
      is_active: input.is_active ?? true,
    });
  },

  async update(input: any) {
    if (!input.id) throw new AppError("معرف التبويب مطلوب", 400);

    return beneficiaryFieldTabsRepository.update(input.id, {
		  tab_code: input.tab_code,
		  tab_name_ar: input.tab_name_ar,
		  tab_name_en: input.tab_name_en || null,
		  sort_order: Number(input.sort_order || 0),
		  is_active: input.is_active ?? true,
		  updated_at: new Date(),
		});
  },
};