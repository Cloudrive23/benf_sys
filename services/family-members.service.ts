import { AppError } from "@/lib/api-error";
import { buildAuditDiff } from "@/lib/audit/audit-diff";
import { auditService } from "@/services/audit.service";
import { familyMembersRepository } from "@/repositories/family-members.repository";

type Actor = {
  id?: string;
  username?: string;
  role?: string;
} | null;

const familyMemberAuditFields = {
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
};

export const familyMembersService = {
  async list(beneficiaryId?: string) {
    return familyMembersRepository.findAll(beneficiaryId);
  },

  async create(input: any, actor?: Actor) {
    if (!input.beneficiary_id) {
      throw new AppError("معرف المستفيد مطلوب", 400);
    }

    if (!input.full_name_ar) {
      throw new AppError("اسم فرد الأسرة مطلوب", 400);
    }

    const created = await familyMembersRepository.create({
      beneficiary_id: input.beneficiary_id,
      full_name_ar: input.full_name_ar,
      gender: input.gender || null,
      birth_date: input.birth_date ? new Date(input.birth_date) : null,
      relationship_type: input.relationship_type || null,
      relationship_lookup_id: input.relationship_lookup_id || null,
      identity_number: input.identity_number || null,
      phone: input.phone || null,
      education_status: input.education_status || null,
      health_status: input.health_status || null,
      notes: input.notes || null,
      is_dependent: input.is_dependent ?? true,
      is_active: input.is_active ?? true,
    });

    await auditService.log({
      userId: actor?.id || null,
      username: actor?.username || null,
      action: "CREATE",
      entityName: "beneficiary_family_members",
      entityType: "family_member",
      entityId: created.id,
      titleAr: "إضافة فرد أسرة",
      descriptionAr: `تمت إضافة فرد الأسرة: ${created.full_name_ar}`,
      newData: created,
      notes: "تم إنشاء سجل فرد أسرة",
    });

    return created;
  },

  async update(input: any, actor?: Actor) {
    if (!input.id) {
      throw new AppError("معرف فرد الأسرة مطلوب", 400);
    }

    if (!input.full_name_ar) {
      throw new AppError("اسم فرد الأسرة مطلوب", 400);
    }

    const oldData = await familyMembersRepository.findById(input.id);

    if (!oldData) {
      throw new AppError("فرد الأسرة غير موجود", 404);
    }

    const updateData = {
      full_name_ar: input.full_name_ar,
      gender: input.gender || null,
      birth_date: input.birth_date ? new Date(input.birth_date) : null,
      relationship_type: input.relationship_type || null,
      relationship_lookup_id: input.relationship_lookup_id || null,
      identity_number: input.identity_number || null,
      phone: input.phone || null,
      education_status: input.education_status || null,
      health_status: input.health_status || null,
      notes: input.notes || null,
      is_dependent: input.is_dependent ?? true,
      is_active: input.is_active ?? true,
      updated_at: new Date(),
    };

    const diff = buildAuditDiff({
      oldData,
      newData: updateData,
      fields: familyMemberAuditFields,
    });

    const updated = await familyMembersRepository.update(input.id, updateData);

    if (diff.hasChanges) {
      await auditService.log({
        userId: actor?.id || null,
        username: actor?.username || null,
        action: "UPDATE",
        entityName: "beneficiary_family_members",
        entityType: "family_member",
        entityId: updated.id,
        titleAr:
          diff.changes.length === 1
            ? `تعديل ${diff.changedText}`
            : "تعديل بيانات فرد أسرة",
        descriptionAr: `تم تعديل ${diff.changedText} لفرد الأسرة: ${updated.full_name_ar}`,
        oldData,
        newData: updated,
        notes: JSON.stringify({
          message: "تم تعديل سجل فرد أسرة",
          changes: diff.changes,
        }),
      });
    }

    return updated;
  },

  async delete(id: string, actor?: Actor) {
    if (!id) {
      throw new AppError("معرف فرد الأسرة مطلوب", 400);
    }

    const oldData = await familyMembersRepository.findById(id);

    if (!oldData) {
      throw new AppError("فرد الأسرة غير موجود", 404);
    }

    const deleted = await familyMembersRepository.softDelete(id);

    await auditService.log({
      userId: actor?.id || null,
      username: actor?.username || null,
      action: "DELETE",
      entityName: "beneficiary_family_members",
      entityType: "family_member",
      entityId: deleted.id,
      titleAr: "حذف فرد أسرة",
      descriptionAr: `تم حذف فرد الأسرة: ${deleted.full_name_ar}`,
      oldData,
      newData: deleted,
      notes: "تم حذف سجل فرد أسرة حذفًا منطقيًا",
    });

    return deleted;
  },
};