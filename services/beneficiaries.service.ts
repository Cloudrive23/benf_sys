import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/lib/api-error";
import {
  createBeneficiarySchema,
  updateBeneficiarySchema,
  type CreateBeneficiaryInput,
  type UpdateBeneficiaryInput,
} from "@/validators/beneficiary.schema";

type Actor = {
  id?: string;
  role?: string;
};

function buildFullName(data: any) {
  return [data.first_name, data.father_name, data.grandfather_name, data.family_name]
    .filter(Boolean)
    .join(" ");
}

function nextNumber(values: (string | null)[]) {
  const max = values
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => Math.max(a, b), 0);

  return String(max + 1);
}

async function getNextBeneficiaryNumbers() {
  const rows = await prisma.beneficiaries.findMany({
    select: {
      beneficiary_code: true,
      file_number: true,
    },
  });

  const beneficiary_code = nextNumber(rows.map((r) => r.beneficiary_code));
  const file_number = nextNumber(rows.map((r) => r.file_number));

  return {
    beneficiary_code,
    file_number,
  };
}

function baseBeneficiaryData(data: any, options?: { allowCodeUpdate?: boolean }) {
  const base: any = {
    file_number: data.file_number,
    external_reference: data.external_reference || data.beneficiary_code,

    branch_id: data.branch_id,
    site_id: data.site_id,
    center_id: data.center_id || null,

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
  };

  if (options?.allowCodeUpdate) {
    base.beneficiary_code = data.beneficiary_code;
  }

  return base;
}

async function checkDuplicate(data: any, actor?: Actor, excludeId?: string) {
  const isAdmin = actor?.role === "admin";

  if (isAdmin && data.allow_duplicate) return;

  const duplicate = await prisma.beneficiaries.findFirst({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      OR: [
        data.beneficiary_code ? { beneficiary_code: data.beneficiary_code } : undefined,
        data.file_number ? { file_number: data.file_number } : undefined,
        data.identity_number ? { identity_number: data.identity_number } : undefined,
        {
          AND: [
            { first_name: data.first_name },
            { father_name: data.father_name },
            { family_name: data.family_name },
            ...(data.birth_date ? [{ birth_date: new Date(data.birth_date) }] : []),
          ],
        },
      ].filter(Boolean) as any,
    },
  });

  if (duplicate) {
    throw new AppError(
      "يوجد مستفيد مشابه أو مكرر. لا يسمح بالتكرار إلا بصلاحية مدير النظام.",
      409
    );
  }
}

async function saveRelatedPerson(tx: any, beneficiaryId: string, relationType: string, person?: any) {
  await tx.beneficiary_related_persons.deleteMany({
    where: {
      beneficiary_id: beneficiaryId,
      relation_type: relationType,
    },
  });

  if (!person?.full_name) return;

  const related = await tx.related_persons.create({
    data: {
      person_code: `${relationType}-${beneficiaryId}-${Date.now()}`.slice(0, 50),
      full_name: person.full_name,
      phone: person.phone || null,
      identity_number: person.identity_number || null,
      is_active: true,
    },
  });

  await tx.beneficiary_related_persons.create({
    data: {
      beneficiary_id: beneficiaryId,
      related_person_id: related.id,
      relation_type: relationType,
      is_primary: true,
    },
  });
}

export const beneficiariesService = {
  async listBeneficiaries() {
    return prisma.beneficiaries.findMany({
      orderBy: { created_at: "desc" },
      include: {
        branches: true,
        sites: true,
        centers: true,
        beneficiary_related_persons: {
          include: {
            related_persons: true,
          },
        },
      },
    });
  },

  async getNextNumbers() {
    return getNextBeneficiaryNumbers();
  },

  async createBeneficiary(input: CreateBeneficiaryInput, actor?: Actor) {
    const parsed = createBeneficiarySchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("خطأ في التحقق من البيانات", 400, parsed.error.flatten());
    }

    const numbers = await getNextBeneficiaryNumbers();

    const data = {
      ...parsed.data,
      beneficiary_code: parsed.data.beneficiary_code || numbers.beneficiary_code,
      file_number: parsed.data.file_number || numbers.file_number,
      external_reference:
        parsed.data.external_reference ||
        parsed.data.beneficiary_code ||
        numbers.beneficiary_code,
    };

    await checkDuplicate(data, actor);

    return prisma.$transaction(async (tx) => {
      const beneficiary = await tx.beneficiaries.create({
        data: {
          ...baseBeneficiaryData(data, { allowCodeUpdate: true }),
          created_by: actor?.id || null,
        },
      });

      await saveRelatedPerson(tx, beneficiary.id, "father", data.father);
      await saveRelatedPerson(tx, beneficiary.id, "mother", data.mother);
      await saveRelatedPerson(tx, beneficiary.id, "guardian", data.guardian);

      return beneficiary;
    });
  },

  async updateBeneficiary(input: UpdateBeneficiaryInput, actor?: Actor) {
    const parsed = updateBeneficiarySchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("خطأ في التحقق من البيانات", 400, parsed.error.flatten());
    }

    const existing = await prisma.beneficiaries.findUnique({
      where: { id: parsed.data.id },
    });

    if (!existing) {
      throw new AppError("المستفيد غير موجود", 404);
    }

    const data = {
      ...parsed.data,
      beneficiary_code: existing.beneficiary_code,
      external_reference:
        parsed.data.external_reference || existing.beneficiary_code,
    };

    await checkDuplicate(data, actor, parsed.data.id);

    return prisma.$transaction(async (tx) => {
      const beneficiary = await tx.beneficiaries.update({
        where: { id: parsed.data.id },
        data: {
          ...baseBeneficiaryData(data, { allowCodeUpdate: false }),
          updated_by: actor?.id || null,
        },
      });

      await saveRelatedPerson(tx, beneficiary.id, "father", data.father);
      await saveRelatedPerson(tx, beneficiary.id, "mother", data.mother);
      await saveRelatedPerson(tx, beneficiary.id, "guardian", data.guardian);

      return beneficiary;
    });
  },

  async deleteBeneficiary(id: string) {
    if (!id) throw new AppError("معرف المستفيد مطلوب", 400);
    return prisma.beneficiaries.delete({ where: { id } });
  },
};
