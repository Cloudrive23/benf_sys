import { AppError } from "@/lib/api-error";
import { duplicateRulesRepository } from "@/repositories/duplicate-rules.repository";

const allowedActionModes = ["warn", "block"];
const allowedScopeLevels = ["system", "branch", "site", "center", "custom"];
const allowedMatchTypes = ["exact", "normalized", "phone", "date", "identity"];

function cleanRuleData(input: any) {
  return {
    entity_key: String(input.entity_key || "").trim(),
    entity_name: String(input.entity_name || "").trim(),
    label_ar: String(input.label_ar || "").trim(),
    rule_name_ar: String(input.rule_name_ar || "").trim(),
    action_mode: input.action_mode || "warn",
    scope_level: input.scope_level || "system",
    scope_field: input.scope_field ? String(input.scope_field).trim() : null,
    display_name_field: input.display_name_field
      ? String(input.display_name_field).trim()
      : null,
    message_ar: input.message_ar ? String(input.message_ar).trim() : null,
    is_active: input.is_active ?? true,
    updated_at: new Date(),
  };
}

function cleanFieldData(input: any) {
  return {
    rule_id: input.rule_id,
    field_name: String(input.field_name || "").trim(),
    field_label_ar: String(input.field_label_ar || "").trim(),
    match_type: input.match_type || "exact",
    is_required: input.is_required ?? true,
    sort_order: Number(input.sort_order || 0),
    is_active: input.is_active ?? true,
    updated_at: new Date(),
  };
}

export const duplicateRulesService = {
  async list() {
    return duplicateRulesRepository.findAll();
  },

  async createRule(input: any) {
    const data = cleanRuleData(input);

    if (!data.entity_key) {
      throw new AppError("مفتاح الكيان مطلوب", 400);
    }

    if (!data.entity_name) {
      throw new AppError("اسم الجدول مطلوب", 400);
    }

    if (!data.label_ar) {
      throw new AppError("اسم الكيان بالعربي مطلوب", 400);
    }

    if (!data.rule_name_ar) {
      throw new AppError("اسم سياسة التكرار مطلوب", 400);
    }

    if (!allowedActionModes.includes(data.action_mode)) {
      throw new AppError("نوع الإجراء غير صحيح", 400);
    }

    if (!allowedScopeLevels.includes(data.scope_level)) {
      throw new AppError("نطاق التحقق غير صحيح", 400);
    }

    if (data.scope_level === "custom" && !data.scope_field) {
      throw new AppError("حقل النطاق المخصص مطلوب", 400);
    }

    return duplicateRulesRepository.createRule({
      ...data,
      created_at: new Date(),
    });
  },

  async updateRule(input: any) {
    if (!input.id) {
      throw new AppError("معرف السياسة مطلوب", 400);
    }

    const oldRule = await duplicateRulesRepository.findById(input.id);

    if (!oldRule) {
      throw new AppError("سياسة التكرار غير موجودة", 404);
    }

    const data = cleanRuleData(input);

    if (!allowedActionModes.includes(data.action_mode)) {
      throw new AppError("نوع الإجراء غير صحيح", 400);
    }

    if (!allowedScopeLevels.includes(data.scope_level)) {
      throw new AppError("نطاق التحقق غير صحيح", 400);
    }

    if (data.scope_level === "custom" && !data.scope_field) {
      throw new AppError("حقل النطاق المخصص مطلوب", 400);
    }

    return duplicateRulesRepository.updateRule(input.id, data);
  },

  async disableRule(id: string) {
    if (!id) {
      throw new AppError("معرف السياسة مطلوب", 400);
    }

    const oldRule = await duplicateRulesRepository.findById(id);

    if (!oldRule) {
      throw new AppError("سياسة التكرار غير موجودة", 404);
    }

    return duplicateRulesRepository.disableRule(id);
  },

  async createField(input: any) {
    const data = cleanFieldData(input);

    if (!data.rule_id) {
      throw new AppError("معرف السياسة مطلوب", 400);
    }

    if (!data.field_name) {
      throw new AppError("اسم الحقل مطلوب", 400);
    }

    if (!data.field_label_ar) {
      throw new AppError("اسم الحقل بالعربي مطلوب", 400);
    }

    if (!allowedMatchTypes.includes(data.match_type)) {
      throw new AppError("نوع المطابقة غير صحيح", 400);
    }

    return duplicateRulesRepository.createField({
      ...data,
      created_at: new Date(),
    });
  },

  async updateField(input: any) {
    if (!input.id) {
      throw new AppError("معرف الحقل مطلوب", 400);
    }

    const data = cleanFieldData(input);

    if (!allowedMatchTypes.includes(data.match_type)) {
      throw new AppError("نوع المطابقة غير صحيح", 400);
    }

    return duplicateRulesRepository.updateField(input.id, data);
  },

  async disableField(id: string) {
    if (!id) {
      throw new AppError("معرف الحقل مطلوب", 400);
    }

    return duplicateRulesRepository.disableField(id);
  },
  
	  async setRuleActive(id: string, isActive: boolean) {
		  if (!id) {
			throw new AppError("معرف السياسة مطلوب", 400);
		  }

		  const oldRule = await duplicateRulesRepository.findById(id);

		  if (!oldRule) {
			throw new AppError("سياسة التكرار غير موجودة", 404);
		  }

		  return duplicateRulesRepository.setRuleActive(id, isActive);
		},

	async setFieldActive(id: string, isActive: boolean) {
		  if (!id) {
			throw new AppError("معرف الحقل مطلوب", 400);
		  }

		  return duplicateRulesRepository.setFieldActive(id, isActive);
		},
};