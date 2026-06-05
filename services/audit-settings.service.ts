import { AppError } from "@/lib/api-error";
import { auditSettingsRepository } from "@/repositories/audit-settings.repository";

const excludedImportFields = [
  "id",
  "created_at",
  "updated_at",
  "deleted_at",
  "created_by",
  "updated_by",
  "is_deleted",
];

const defaultArabicLabels: Record<string, string> = {
  code: "الرقم",
  name: "الاسم",
  name_ar: "الاسم العربي",
  name_en: "الاسم الإنجليزي",
  full_name: "الاسم الكامل",
  full_name_ar: "الاسم العربي",
  full_name_en: "الاسم الإنجليزي",

  branch_id: "الفرع",
  site_id: "الموقع",
  center_id: "المركز",

  identity_number: "رقم الهوية",
  phone: "الهاتف",
  alternative_phone: "هاتف بديل",
  address: "العنوان",
  notes: "الملاحظات",

  birth_date: "تاريخ الميلاد",
  death_date: "تاريخ الوفاة",
  death_reason_id: "سبب الوفاة",

  gender: "الجنس",
  gender_id: "الجنس",

  marital_status_id: "الحالة الاجتماعية",
  occupation_id: "المهنة",
  nationality_id: "الجنسية",
  health_status_id: "الحالة الصحية",
  education_status: "الحالة التعليمية",
  health_status: "الحالة الصحية",

  is_active: "الحالة",
  is_deleted: "محذوف؟",
  is_alive: "على قيد الحياة",
  is_guardian: "هل هو المعيل",
  is_dependent: "هل هو معال",

  mother_id: "الأم",
  father_id: "الأب",
  guardian_id: "المعيل",
  beneficiary_id: "المستفيد",

  relationship_type: "صلة القرابة",
  relationship_lookup_id: "صلة القرابة",
  relationship_type_id: "صلة القرابة",
};

function guessArabicLabel(fieldName: string) {
  if (defaultArabicLabels[fieldName]) {
    return defaultArabicLabels[fieldName];
  }

  return fieldName
    .replace(/_id$/, "")
    .replace(/_/g, " ");
}

function guessIsLookup(fieldName: string) {
  return (
    fieldName.endsWith("_id") &&
    !["branch_id", "site_id", "center_id", "beneficiary_id"].includes(fieldName)
  );
}

function guessLookupType(fieldName: string) {
  const map: Record<string, string> = {
    gender: "genders",
    gender_id: "genders",
    marital_status_id: "marital_status",
    occupation_id: "occupations",
    nationality_id: "nationalities",
    health_status: "health_statuses",
    health_status_id: "health_statuses",
    education_status: "education_levels",
    death_reason_id: "death_reasons",
    relationship_lookup_id: "relationship_types",
    relationship_type_id: "relationship_types",
  };

  return map[fieldName] || null;
}

function cleanEntityData(input: any) {
  return {
    entity_key: String(input.entity_key || "").trim(),
    entity_name: String(input.entity_name || "").trim(),
    entity_type: String(input.entity_type || "").trim(),
    label_ar: String(input.label_ar || "").trim(),
    display_name_field: input.display_name_field
      ? String(input.display_name_field).trim()
      : null,
    is_active: input.is_active ?? true,
    updated_at: new Date(),
  };
}

function cleanFieldData(input: any) {
  return {
    entity_id: input.entity_id,
    field_name: String(input.field_name || "").trim(),
    field_label_ar: String(input.field_label_ar || "").trim(),
    is_tracked: input.is_tracked ?? true,
    is_lookup: input.is_lookup ?? false,
    lookup_type: input.lookup_type ? String(input.lookup_type).trim() : null,
    sort_order: Number(input.sort_order || 0),
    is_active: input.is_active ?? true,
    updated_at: new Date(),
  };
}

export const auditSettingsService = {
  async list() {
    return auditSettingsRepository.findAll();
  },

  async createEntity(input: any) {
    const data = cleanEntityData(input);

    if (!data.entity_key) {
      throw new AppError("مفتاح الكيان مطلوب", 400);
    }

    if (!data.entity_name) {
      throw new AppError("اسم الجدول مطلوب", 400);
    }

    if (!data.entity_type) {
      throw new AppError("نوع الكيان مطلوب", 400);
    }

    if (!data.label_ar) {
      throw new AppError("الاسم العربي للكيان مطلوب", 400);
    }

    const exists = await auditSettingsRepository.findEntityByKey(
      data.entity_key
    );

    if (exists) {
      throw new AppError("مفتاح الكيان موجود مسبقًا", 409);
    }

    return auditSettingsRepository.createEntity({
      ...data,
      created_at: new Date(),
    });
  },

  async updateEntity(input: any) {
    if (!input.id) {
      throw new AppError("معرف الكيان مطلوب", 400);
    }

    const oldEntity = await auditSettingsRepository.findEntityById(input.id);

    if (!oldEntity) {
      throw new AppError("الكيان غير موجود", 404);
    }

    const data = cleanEntityData(input);

    return auditSettingsRepository.updateEntity(input.id, data);
  },

  async disableEntity(id: string) {
    if (!id) {
      throw new AppError("معرف الكيان مطلوب", 400);
    }

    const oldEntity = await auditSettingsRepository.findEntityById(id);

    if (!oldEntity) {
      throw new AppError("الكيان غير موجود", 404);
    }

    return auditSettingsRepository.disableEntity(id);
  },

  async createField(input: any) {
    const data = cleanFieldData(input);

    if (!data.entity_id) {
      throw new AppError("معرف الكيان مطلوب", 400);
    }

    if (!data.field_name) {
      throw new AppError("اسم الحقل مطلوب", 400);
    }

    if (!data.field_label_ar) {
      throw new AppError("الاسم العربي للحقل مطلوب", 400);
    }

    return auditSettingsRepository.createField({
      ...data,
      created_at: new Date(),
    });
  },

  async updateField(input: any) {
    if (!input.id) {
      throw new AppError("معرف الحقل مطلوب", 400);
    }

    const data = cleanFieldData(input);

    return auditSettingsRepository.updateField(input.id, data);
  },

  async disableField(id: string) {
    if (!id) {
      throw new AppError("معرف الحقل مطلوب", 400);
    }

    return auditSettingsRepository.disableField(id);
  },
  
    async importFields(input: any) {
			const entityId = input.entity_id;

			if (!entityId) {
			  throw new AppError("معرف الكيان مطلوب", 400);
			}

			const entity = await auditSettingsRepository.findEntityById(entityId);

			if (!entity) {
			  throw new AppError("الكيان غير موجود", 404);
			}

			const tableName = entity.entity_name;

			if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
			  throw new AppError("اسم الجدول غير صحيح", 400);
			}

			const { prisma } = await import("@/app/lib/prisma");

			const columns = await prisma.$queryRawUnsafe<any[]>(`
			  select
				column_name,
				data_type,
				ordinal_position
			  from information_schema.columns
			  where table_schema = 'public'
				and table_name = '${tableName}'
			  order by ordinal_position asc
			`);

			const existingFields = new Set(
			  entity.fields.map((field: any) => field.field_name)
			);

			const fieldsToCreate = columns
			  .filter((column) => !excludedImportFields.includes(column.column_name))
			  .filter((column) => !existingFields.has(column.column_name))
			  .map((column) => {
				const fieldName = column.column_name;
				const isLookup = guessIsLookup(fieldName);
				const lookupType = guessLookupType(fieldName);

				return {
				  entity_id: entity.id,
				  field_name: fieldName,
				  field_label_ar: guessArabicLabel(fieldName),
				  is_tracked: true,
				  is_lookup: Boolean(lookupType || isLookup),
				  lookup_type: lookupType,
				  sort_order: column.ordinal_position,
				  is_active: true,
				  created_at: new Date(),
				  updated_at: new Date(),
				};
			  });

			const result = await auditSettingsRepository.createManyFields(fieldsToCreate);

			return {
			  imported_count: result.count,
			  skipped_count: columns.length - fieldsToCreate.length,
			  fields: fieldsToCreate,
			};
		  },
};