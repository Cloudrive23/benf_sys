import { AppError } from "@/lib/api-error";
import {
  logCreate,
  logDelete,
  logUpdate,
} from "@/lib/audit/audit-logger";
import { familyMembersRepository } from "@/repositories/family-members.repository";

type Actor = {
  id?: string;
  username?: string;
  role?: string;
} | null;

function mapFamilyMemberData(input: any) {
  return {
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
  };
}

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

    const created = await familyMembersRepository.create(
      mapFamilyMemberData(input)
    );

    await logCreate({
      entityKey: "family_member",
      entityId: created.id,
      data: created,
      actor,
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
      ...mapFamilyMemberData({
        ...input,
        beneficiary_id: oldData.beneficiary_id,
      }),
      updated_at: new Date(),
    };

    const updated = await familyMembersRepository.update(input.id, updateData);

    await logUpdate({
      entityKey: "family_member",
      entityId: updated.id,
      oldData,
      newData: updated,
      actor,
    });

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

    await logDelete({
      entityKey: "family_member",
      entityId: deleted.id,
      oldData,
      newData: deleted,
      actor,
    });

    return deleted;
  },
};