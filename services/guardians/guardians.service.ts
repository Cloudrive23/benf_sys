import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/lib/api-error";
import { auditService } from "@/services/audit.service";
import { guardiansRepository } from "@/repositories/guardians/guardians.repository";
import {
  createGuardianSchema,
  updateGuardianSchema,
  type CreateGuardianInput,
  type UpdateGuardianInput,
} from "@/validators/guardians/guardian.schema";

function nextNumber(values: (string | null)[]) {
  const max = values
    .map((v) => Number(String(v || "").replace("G-", "").trim()))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => Math.max(a, b), 0);

  return `G-${String(max + 1).padStart(6, "0")}`;
}

async function getNextGuardianCode() {
  const rows = await prisma.guardians.findMany({
    select: { guardian_code: true },
  });

  return nextNumber(rows.map((x) => x.guardian_code));
}

function mapGuardianData(data: any) {
  return {
    branch_id: data.branch_id,

    full_name_ar: data.full_name_ar,
    full_name_en: data.full_name_en || null,

    identity_number: data.identity_number || null,
    birth_date: data.birth_date ? new Date(data.birth_date) : null,

    gender_id: data.gender_id || null,
    relationship_type_id: data.relationship_type_id || null,
    marital_status_id: data.marital_status_id || null,
    occupation_id: data.occupation_id || null,
    nationality_id: data.nationality_id || null,
    health_status_id: data.health_status_id || null,

    phone: data.phone || null,
    address: data.address || null,
    notes: data.notes || null,

    is_mother: data.is_mother ?? false,
    mother_id: data.is_mother ? data.mother_id || null : null,

    is_active: data.is_active ?? true,
    is_deleted: false,
  };
}

export const guardiansService = {
  async listGuardians() {
    return guardiansRepository.findAll();
  },

  async getNextCode() {
    return {
      guardian_code: await getNextGuardianCode(),
    };
  },

  async createGuardian(input: CreateGuardianInput) {
    const parsed = createGuardianSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("??? ?? ?????? ?? ????????", 400, parsed.error.flatten());
    }

    if (parsed.data.identity_number) {
      const duplicateIdentity = await guardiansRepository.findByIdentity(
        parsed.data.identity_number
      );

      if (duplicateIdentity) {
        throw new AppError("??? ???? ?????? ????? ??????", 409);
      }
    }

    const duplicateSimilar = await guardiansRepository.findSimilar({
      full_name_ar: parsed.data.full_name_ar,
      birth_date: parsed.data.birth_date || null,
    });

    if (duplicateSimilar) {
      throw new AppError("???? ???? ???? ????? ?????? ???????", 409);
    }

    const guardian_code = await getNextGuardianCode();

    const guardian = await guardiansRepository.create({
      guardian_code,
      ...mapGuardianData(parsed.data),
    });

    await auditService.log({
      action: "CREATE",
      entityName: "guardians",
      entityId: guardian.id,
      newData: guardian,
      notes: "?? ????? ??? ????",
    });

    return guardian;
  },

  async updateGuardian(input: UpdateGuardianInput) {
    const parsed = updateGuardianSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("??? ?? ?????? ?? ????????", 400, parsed.error.flatten());
    }

    const oldGuardian = await prisma.guardians.findUnique({
      where: { id: parsed.data.id },
    });

    if (!oldGuardian) {
      throw new AppError("??? ?????? ??? ?????", 404);
    }

    if (parsed.data.identity_number) {
      const duplicateIdentity = await guardiansRepository.findByIdentity(
        parsed.data.identity_number,
        parsed.data.id
      );

      if (duplicateIdentity) {
        throw new AppError("??? ???? ?????? ????? ??????", 409);
      }
    }

    const duplicateSimilar = await guardiansRepository.findSimilar({
      full_name_ar: parsed.data.full_name_ar,
      birth_date: parsed.data.birth_date || null,
      excludeId: parsed.data.id,
    });

    if (duplicateSimilar) {
      throw new AppError("???? ???? ???? ????? ?????? ???????", 409);
    }

    const guardian = await guardiansRepository.update(parsed.data.id, {
      ...mapGuardianData(parsed.data),
      updated_at: new Date(),
    });

    await auditService.log({
      action: "UPDATE",
      entityName: "guardians",
      entityId: guardian.id,
      oldData: oldGuardian,
      newData: guardian,
      notes: "?? ????? ??? ????",
    });

    return guardian;
  },

  async deleteGuardian(id: string) {
    if (!id) {
      throw new AppError("???? ?????? ?????", 400);
    }

    const oldGuardian = await prisma.guardians.findUnique({
      where: { id },
    });

    if (!oldGuardian) {
      throw new AppError("??? ?????? ??? ?????", 404);
    }

    const guardian = await guardiansRepository.update(id, {
      is_deleted: true,
      is_active: false,
      updated_at: new Date(),
    });

    await auditService.log({
      action: "DELETE",
      entityName: "guardians",
      entityId: id,
      oldData: oldGuardian,
      notes: "?? ??? ??? ???? ????? ???????",
    });

    return guardian;
  },
};