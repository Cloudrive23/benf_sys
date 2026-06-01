import { AppError } from "@/lib/api-error";
import { beneficiaryFieldGroupsRepository } from "@/repositories/beneficiary-fields/beneficiary-field-groups.repository";

export const beneficiaryFieldGroupsService = {
  async list() {
    return beneficiaryFieldGroupsRepository.findAll();
  },

  async create(input: any) {
    if (!input.tab_id) {
      throw new AppError("التبويب مطلوب", 400);
    }

    if (!input.group_code || !input.group_name_ar) {
      throw new AppError("كود واسم المجموعة مطلوبان", 400);
    }

    return beneficiaryFieldGroupsRepository.create({
      tab_id: input.tab_id,
      group_code: input.group_code,
      group_name_ar: input.group_name_ar,
      group_name_en: input.group_name_en || null,
      sort_order: Number(input.sort_order || 0),
      is_active: input.is_active ?? true,
    });
  },

  async update(input: any) {
    if (!input.id) {
      throw new AppError("معرف المجموعة مطلوب", 400);
    }

    return beneficiaryFieldGroupsRepository.update(input.id, {
	  tab_id: input.tab_id || null,
	  group_code: input.group_code,
	  group_name_ar: input.group_name_ar,
	  group_name_en: input.group_name_en || null,
	  sort_order: Number(input.sort_order || 0),
	  is_active: input.is_active ?? true,
	  updated_at: new Date(),
	});
  },
};