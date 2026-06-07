import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/lib/api-error";
import { entityDefinitionsRepository } from "@/repositories/entity-definitions.repository";

type ReferenceConfig = {
  reference_type: "none" | "lookup" | "table";
  reference_table: string | null;
  reference_key_field: string;
  reference_label_field: string | null;
  lookup_type: string | null;
};

function cleanEntityData(input: any) {
  return {
    entity_key: String(input.entity_key || "").trim(),
    table_name: String(input.table_name || "").trim(),

    label_ar: String(input.label_ar || "").trim(),
    label_en: input.label_en ? String(input.label_en).trim() : null,

    route_path: input.route_path ? String(input.route_path).trim() : null,
    api_path: input.api_path ? String(input.api_path).trim() : null,

    display_name_field: input.display_name_field
      ? String(input.display_name_field).trim()
      : null,

    code_field: input.code_field ? String(input.code_field).trim() : null,
    icon_name: input.icon_name ? String(input.icon_name).trim() : null,

    is_system: input.is_system ?? false,
    is_active: input.is_active ?? true,

    allow_create: input.allow_create ?? true,
    allow_update: input.allow_update ?? true,
    allow_delete: input.allow_delete ?? true,
    allow_import: input.allow_import ?? false,
    allow_export: input.allow_export ?? true,

    updated_at: new Date(),
  };
}

function cleanFieldData(input: any) {
  return {
    entity_id: input.entity_id,

    field_name: String(input.field_name || "").trim(),
    field_label_ar: String(input.field_label_ar || "").trim(),
    field_label_en: input.field_label_en
      ? String(input.field_label_en).trim()
      : null,

    data_type: input.data_type ? String(input.data_type).trim() : null,
    input_type: input.input_type || "text",

    is_required: input.is_required ?? false,
    is_visible_in_table: input.is_visible_in_table ?? true,
    is_visible_in_form: input.is_visible_in_form ?? true,
    is_readonly: input.is_readonly ?? false,

    is_lookup: input.is_lookup ?? false,
    lookup_type: input.lookup_type ? String(input.lookup_type).trim() : null,

    reference_type: input.reference_type || "none",
    reference_table: input.reference_table
      ? String(input.reference_table).trim()
      : null,
    reference_key_field: input.reference_key_field
      ? String(input.reference_key_field).trim()
      : "id",
    reference_label_field: input.reference_label_field
      ? String(input.reference_label_field).trim()
      : null,

    sort_order: Number(input.sort_order || 0),
    is_active: input.is_active ?? true,

    updated_at: new Date(),
  };
}

function guessInputType(fieldName: string, dataType: string) {
  if (fieldName.endsWith("_id")) return "select";
  if (fieldName.includes("date")) return "date";
  if (dataType.includes("boolean")) return "checkbox";
  if (fieldName.includes("notes") || fieldName.includes("address")) {
    return "textarea";
  }
  if (fieldName.includes("phone")) return "tel";
  if (fieldName.includes("email")) return "email";

  return "text";
}

function guessArabicFieldLabel(fieldName: string) {
  const map: Record<string, string> = {
    father_code: "رقم الأب",
    mother_code: "رقم الأم",
    guardian_code: "رقم المعيل",
    beneficiary_code: "رقم المستفيد",
    family_member_code: "رقم فرد الأسرة",

    branch_id: "الفرع",
    site_id: "الموقع",
    center_id: "المركز",

    father_id: "الأب",
    mother_id: "الأم",
    guardian_id: "المعيل",
    beneficiary_id: "المستفيد",
    family_id: "الأسرة",
    family_member_id: "فرد الأسرة",

    full_name_ar: "الاسم العربي",
    full_name_en: "الاسم الإنجليزي",
    first_name_ar: "الاسم الأول",
    second_name_ar: "الاسم الثاني",
    third_name_ar: "الاسم الثالث",
    fourth_name_ar: "الاسم الرابع",
    last_name_ar: "اللقب",

    identity_number: "رقم الهوية",
    birth_date: "تاريخ الميلاد",
    death_date: "تاريخ الوفاة",
    death_reason_id: "سبب الوفاة",

    gender_id: "الجنس",
    relationship_type_id: "صلة القرابة",
    marital_status_id: "الحالة الاجتماعية",
    occupation_id: "المهنة",
    nationality_id: "الجنسية",
    health_status_id: "الحالة الصحية",
    education_level_id: "المستوى التعليمي",
    educational_level_id: "المستوى التعليمي",
    disability_type_id: "نوع الإعاقة",
    disease_type_id: "نوع المرض",
    orphan_status_id: "حالة اليتيم",
    housing_type_id: "نوع السكن",
    income_source_id: "مصدر الدخل",

    phone: "الهاتف",
    mobile: "الجوال",
    email: "البريد الإلكتروني",
    address: "العنوان",
    notes: "ملاحظات",

    is_active: "نشط",
    is_alive: "على قيد الحياة",
    is_guardian: "هل هو وصي؟",
    is_mother: "هل هو الأم؟",
  };

  return map[fieldName] || fieldName;
}

function noneReference(): ReferenceConfig {
  return {
    reference_type: "none",
    reference_table: null,
    reference_key_field: "id",
    reference_label_field: null,
    lookup_type: null,
  };
}

function tableReference(
  tableName: string,
  labelField: string
): ReferenceConfig {
  return {
    reference_type: "table",
    reference_table: tableName,
    reference_key_field: "id",
    reference_label_field: labelField,
    lookup_type: null,
  };
}

function lookupReference(lookupType: string): ReferenceConfig {
  return {
    reference_type: "lookup",
    reference_table: null,
    reference_key_field: "id",
    reference_label_field: null,
    lookup_type: lookupType,
  };
}

function guessReferenceConfig(fieldName: string): ReferenceConfig {
  const tableReferences: Record<string, ReferenceConfig> = {
    branch_id: tableReference("branches", "branch_name_ar"),
    site_id: tableReference("sites", "site_name_ar"),
    center_id: tableReference("centers", "center_name_ar"),

    father_id: tableReference("fathers", "full_name_ar"),
    mother_id: tableReference("mothers", "full_name_ar"),
    guardian_id: tableReference("guardians", "full_name_ar"),
    beneficiary_id: tableReference("beneficiaries", "full_name_ar"),
    family_member_id: tableReference("family_members", "full_name_ar"),
  };

  const lookupReferences: Record<string, ReferenceConfig> = {
    gender_id: lookupReference("genders"),
    relationship_type_id: lookupReference("relationship_types"),
    marital_status_id: lookupReference("marital_status"),
    occupation_id: lookupReference("occupations"),
    nationality_id: lookupReference("nationalities"),
    health_status_id: lookupReference("health_statuses"),
    death_reason_id: lookupReference("death_reasons"),

    education_level_id: lookupReference("education_levels"),
    educational_level_id: lookupReference("education_levels"),
    disability_type_id: lookupReference("disability_types"),
    disease_type_id: lookupReference("disease_types"),
    orphan_status_id: lookupReference("orphan_statuses"),
    housing_type_id: lookupReference("housing_types"),
    income_source_id: lookupReference("income_sources"),
  };

  if (tableReferences[fieldName]) {
    return tableReferences[fieldName];
  }

  if (lookupReferences[fieldName]) {
    return lookupReferences[fieldName];
  }

  return noneReference();
}

export const entityDefinitionsService = {
  async list() {
    return entityDefinitionsRepository.findAll();
  },

  async getByKey(entityKey: string) {
    if (!entityKey) {
      throw new AppError("مفتاح الكيان مطلوب", 400);
    }

    const entity = await entityDefinitionsRepository.findByKey(entityKey);

    if (!entity) {
      throw new AppError("تعريف الكيان غير موجود", 404);
    }

    return entity;
  },

  async create(input: any) {
    const data = cleanEntityData(input);

    if (!data.entity_key) throw new AppError("مفتاح الكيان مطلوب", 400);
    if (!data.table_name) throw new AppError("اسم الجدول مطلوب", 400);
    if (!data.label_ar) throw new AppError("اسم الكيان بالعربي مطلوب", 400);

    return entityDefinitionsRepository.create({
      ...data,
      created_at: new Date(),
    });
  },

  async update(input: any) {
    if (!input.id) {
      throw new AppError("معرف الكيان مطلوب", 400);
    }

    const oldEntity = await entityDefinitionsRepository.findById(input.id);

    if (!oldEntity) {
      throw new AppError("تعريف الكيان غير موجود", 404);
    }

    const data = cleanEntityData(input);

    return entityDefinitionsRepository.update(input.id, data);
  },

  async setEntityActive(id: string, isActive: boolean) {
    if (!id) throw new AppError("معرف الكيان مطلوب", 400);

    return entityDefinitionsRepository.setEntityActive(id, isActive);
  },

  async createField(input: any) {
    const data = cleanFieldData(input);

    if (!data.entity_id) throw new AppError("معرف الكيان مطلوب", 400);
    if (!data.field_name) throw new AppError("اسم الحقل مطلوب", 400);
    if (!data.field_label_ar) {
      throw new AppError("اسم الحقل بالعربي مطلوب", 400);
    }

    return entityDefinitionsRepository.createField({
      ...data,
      created_at: new Date(),
    });
  },

  async updateField(input: any) {
    if (!input.id) {
      throw new AppError("معرف الحقل مطلوب", 400);
    }

    const data = cleanFieldData(input);

    return entityDefinitionsRepository.updateField(input.id, data);
  },

  async setFieldActive(id: string, isActive: boolean) {
    if (!id) throw new AppError("معرف الحقل مطلوب", 400);

    return entityDefinitionsRepository.setFieldActive(id, isActive);
  },

  async importFields(entityId: string) {
    const entity = await entityDefinitionsRepository.findById(entityId);

    if (!entity) {
      throw new AppError("تعريف الكيان غير موجود", 404);
    }

    const columns = await prisma.$queryRaw<any[]>`
      select
        column_name,
        data_type,
        ordinal_position
      from information_schema.columns
      where table_schema = 'public'
        and table_name = ${entity.table_name}
      order by ordinal_position asc
    `;

    const excludedFields = [
      "id",
      "created_at",
      "updated_at",
      "deleted_at",
      "created_by",
      "updated_by",
      "is_deleted",
    ];

    const results = [];

    for (const column of columns) {
      const fieldName = column.column_name;

      if (excludedFields.includes(fieldName)) continue;

      const referenceConfig = guessReferenceConfig(fieldName);
      const inputType =
        referenceConfig.reference_type !== "none"
          ? "select"
          : guessInputType(fieldName, column.data_type || "");

      try {
        const created = await entityDefinitionsRepository.createField({
          entity_id: entity.id,
          field_name: fieldName,
          field_label_ar: guessArabicFieldLabel(fieldName),
          data_type: column.data_type,
          input_type: inputType,

          is_required: false,
          is_visible_in_table: true,
          is_visible_in_form: true,
          is_readonly: fieldName.endsWith("_code"),

          is_lookup: referenceConfig.reference_type !== "none",
          lookup_type: referenceConfig.lookup_type,

          reference_type: referenceConfig.reference_type,
          reference_table: referenceConfig.reference_table,
          reference_key_field: referenceConfig.reference_key_field,
          reference_label_field: referenceConfig.reference_label_field,

          sort_order: column.ordinal_position || 0,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        });

        results.push({
          field_name: fieldName,
          status: "created",
          id: created.id,
        });
      } catch {
        results.push({
          field_name: fieldName,
          status: "exists",
        });
      }
    }

    return results;
  },
};