import { AppError } from "@/lib/api-error";
import { familyMembersRepository } from "@/repositories/family-members.repository";

export const familyMembersService = {
  async list(beneficiaryId?: string) {
    return familyMembersRepository.findAll(beneficiaryId);
  },

  async create(input: any) {
    if (!input.beneficiary_id) {
      throw new AppError("معرف المستفيد مطلوب", 400);
    }

    if (!input.full_name_ar) {
      throw new AppError("اسم فرد الأسرة مطلوب", 400);
    }

    return familyMembersRepository.create({
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
  },

  async update(input: any) {
    if (!input.id) {
      throw new AppError("معرف فرد الأسرة مطلوب", 400);
    }

    if (!input.full_name_ar) {
      throw new AppError("اسم فرد الأسرة مطلوب", 400);
    }

    return familyMembersRepository.update(input.id, {
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
    });
  },
};