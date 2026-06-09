import { AppError } from "@/lib/api-error";
import { beneficiarySponsorLinksRepository } from "@/repositories/beneficiary-sponsor-links.repository";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export const beneficiarySponsorLinksService = {
  async listByBeneficiary(beneficiaryId: string | null) {
    if (!beneficiaryId) {
      throw new AppError("يجب تحديد المستفيد", 400);
    }

    if (!isUuid(beneficiaryId)) {
      throw new AppError("معرّف المستفيد غير صحيح", 400);
    }

    return beneficiarySponsorLinksRepository.listByBeneficiary(beneficiaryId);
  },
};
