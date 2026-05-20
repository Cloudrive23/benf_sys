import { AppError } from "@/lib/api-error";
import { beneficiariesRepository } from "@/repositories/beneficiaries.repository";
import {
  createBeneficiarySchema,
  updateBeneficiarySchema,
  type CreateBeneficiaryInput,
  type UpdateBeneficiaryInput,
} from "@/validators/beneficiary.schema";

function buildFullName(data: any) {
  return [
    data.first_name,
    data.father_name,
    data.grandfather_name,
    data.family_name,
  ]
    .filter(Boolean)
    .join(" ");
}

function mapBeneficiaryData(data: any) {
  return {
    beneficiary_code: data.beneficiary_code,
    file_number: data.file_number,
    external_reference: data.external_reference || null,
    beneficiary_type: data.beneficiary_type || "orphan",
    first_name: data.first_name,
    father_name: data.father_name,
    grandfather_name: data.grandfather_name || null,
    family_name: data.family_name,
    full_name: buildFullName(data),
    gender: data.gender,
    birth_date: data.birth_date ? new Date(data.birth_date) : null,
    identity_number: data.identity_number || null,
    phone: data.phone || null,
    address: data.address || null,
    current_status: data.current_status || "draft",
    is_active: data.is_active ?? true,

    // Default branch/site until branch selector is added to the UI
    branch_id: "df37cbf2-5629-4231-9fe3-331d568ed91e",
    site_id: "b48f984a-79a3-4fad-a9cd-6fa756ace049",
  };
}

export const beneficiariesService = {
  async listBeneficiaries() {
    return beneficiariesRepository.findAll();
  },

  async createBeneficiary(input: CreateBeneficiaryInput) {
    const parsed = createBeneficiarySchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("خطأ في التحقق من البيانات", 400, parsed.error.flatten());
    }

    const existing = await beneficiariesRepository.findByCode(parsed.data.beneficiary_code);

    if (existing) {
      throw new AppError("رقم المستفيد موجود مسبقًا", 409);
    }

    return beneficiariesRepository.create(mapBeneficiaryData(parsed.data));
  },

  async updateBeneficiary(input: UpdateBeneficiaryInput) {
    const parsed = updateBeneficiarySchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("خطأ في التحقق من البيانات", 400, parsed.error.flatten());
    }

    return beneficiariesRepository.update(parsed.data.id, mapBeneficiaryData(parsed.data));
  },

  async deleteBeneficiary(id: string) {
    if (!id) throw new AppError("معرف المستفيد مطلوب", 400);
    return beneficiariesRepository.delete(id);
  },
};
