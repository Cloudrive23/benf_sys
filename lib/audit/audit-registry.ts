export type AuditEntityConfig = {
  entityName: string;
  entityType: string;
  label: string;
  displayNameField?: string;
  fields: Record<string, string>;
};

export const auditRegistry: Record<string, AuditEntityConfig> = {
  family_member: {
    entityName: "beneficiary_family_members",
    entityType: "family_member",
    label: "فرد أسرة",
    displayNameField: "full_name_ar",
    fields: {
      full_name_ar: "الاسم",
      gender: "الجنس",
      birth_date: "تاريخ الميلاد",
      relationship_type: "صلة القرابة",
      relationship_lookup_id: "صلة القرابة",
      identity_number: "رقم الهوية",
      phone: "الهاتف",
      education_status: "الحالة التعليمية",
      health_status: "الحالة الصحية",
      notes: "الملاحظات",
      is_dependent: "هل هو معال",
      is_active: "الحالة",
    },
  },

  father: {
    entityName: "fathers",
    entityType: "father",
    label: "الأب",
    displayNameField: "full_name_ar",
    fields: {
      father_code: "رقم الأب",
      branch_id: "الفرع",
      full_name_ar: "الاسم العربي",
      full_name_en: "الاسم الإنجليزي",
      identity_number: "رقم الهوية",
      birth_date: "تاريخ الميلاد",
      death_date: "تاريخ الوفاة",
      death_reason_id: "سبب الوفاة",
      occupation: "المهنة",
      occupation_id: "المهنة",
      phone: "الهاتف",
      address: "العنوان",
      notes: "الملاحظات",
      is_active: "الحالة",
    },
  },

  mother: {
    entityName: "mothers",
    entityType: "mother",
    label: "الأم",
    displayNameField: "full_name_ar",
    fields: {
      mother_code: "رقم الأم",
      branch_id: "الفرع",
      full_name_ar: "الاسم العربي",
      full_name_en: "الاسم الإنجليزي",
      identity_number: "رقم الهوية",
      birth_date: "تاريخ الميلاد",
      death_date: "تاريخ الوفاة",
      death_reason_id: "سبب الوفاة",
      marital_status_id: "الحالة الاجتماعية",
      gender_id: "الجنس",
      occupation_id: "المهنة",
      nationality_id: "الجنسية",
      health_status_id: "الحالة الصحية",
      is_guardian: "هل الأم هي المعيل",
      is_alive: "على قيد الحياة",
      phone: "الهاتف",
      address: "العنوان",
      notes: "الملاحظات",
      is_active: "الحالة",
    },
  },

  guardian: {
    entityName: "guardians",
    entityType: "guardian",
    label: "المعيل",
    displayNameField: "full_name_ar",
    fields: {
      guardian_code: "رقم المعيل",
      branch_id: "الفرع",
      full_name_ar: "الاسم العربي",
      full_name_en: "الاسم الإنجليزي",
      identity_number: "رقم الهوية",
      birth_date: "تاريخ الميلاد",
      gender_id: "الجنس",
      relationship_type_id: "صلة القرابة",
      marital_status_id: "الحالة الاجتماعية",
      occupation_id: "المهنة",
      nationality_id: "الجنسية",
      health_status_id: "الحالة الصحية",
      phone: "الهاتف",
      address: "العنوان",
      notes: "الملاحظات",
      is_mother: "هل هو الأم",
      mother_id: "الأم المرتبطة",
      is_alive: "على قيد الحياة",
      death_date: "تاريخ الوفاة",
      death_reason_id: "سبب الوفاة",
      is_active: "الحالة",
    },
  },

  beneficiary: {
    entityName: "beneficiaries",
    entityType: "beneficiary",
    label: "المستفيد",
    displayNameField: "full_name",
    fields: {
      beneficiary_code: "رقم المستفيد",
      file_number: "رقم الملف",
      beneficiary_type: "نوع المستفيد",
      branch_id: "الفرع",
      site_id: "الموقع",
      center_id: "المركز",
      first_name: "الاسم الأول",
      father_name: "اسم الأب",
      grandfather_name: "اسم الجد",
      family_name: "اللقب",
      full_name: "الاسم الكامل",
      gender: "الجنس",
      birth_date: "تاريخ الميلاد",
      birth_place: "مكان الميلاد",
      nationality: "الجنسية",
      identity_type: "نوع الهوية",
      identity_number: "رقم الهوية",
      phone: "الهاتف",
      alternative_phone: "هاتف بديل",
      address: "العنوان",
      current_status: "الحالة الحالية",
      father_id: "الأب",
      mother_id: "الأم",
      guardian_id: "المعيل",
      status_id: "حالة المستفيد",
      social_notes: "ملاحظات اجتماعية",
      notes: "الملاحظات",
      is_active: "الحالة",
    },
  },
};

export function getAuditEntityConfig(entityKey: string) {
  const config = auditRegistry[entityKey];

  if (!config) {
    throw new Error(`Audit entity config not found: ${entityKey}`);
  }

  return config;
}