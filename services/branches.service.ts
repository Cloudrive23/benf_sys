import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/lib/api-error";
import { branchesRepository } from "@/repositories/branches.repository";
import {
  createBranchSchema,
  updateBranchSchema,
  type CreateBranchInput,
  type UpdateBranchInput,
} from "@/validators/branch.schema";

function nextNumber(values: (string | null)[]) {
  const max = values
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => Math.max(a, b), 0);

  return String(max + 1);
}

async function getNextBranchCode() {
  const rows = await prisma.branches.findMany({
    select: {
      branch_code: true,
    },
  });

  return nextNumber(rows.map((x) => x.branch_code));
}

export const branchesService = {
  async listBranches() {
    return branchesRepository.findAll();
  },

  async getNextCode() {
    return {
      branch_code: await getNextBranchCode(),
    };
  },

  async createBranch(input: CreateBranchInput) {
    const parsed = createBranchSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("خطأ في التحقق من البيانات", 400, parsed.error.flatten());
    }

    const duplicateName = await branchesRepository.findDuplicateName(
      parsed.data.branch_name_ar
    );

    if (duplicateName) {
      throw new AppError("اسم الفرع موجود مسبقًا", 409);
    }

    const branch_code =
      parsed.data.branch_code || (await getNextBranchCode());

    const duplicateCode = await branchesRepository.findByCode(branch_code);

    if (duplicateCode) {
      throw new AppError("رقم الفرع موجود مسبقًا", 409);
    }

    return branchesRepository.create({
      branch_code,
      branch_name_ar: parsed.data.branch_name_ar,
      branch_name_en: parsed.data.branch_name_en || null,
      city: parsed.data.city || null,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      is_active: parsed.data.is_active ?? true,
    });
  },

  async updateBranch(input: UpdateBranchInput) {
    const parsed = updateBranchSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("خطأ في التحقق من البيانات", 400, parsed.error.flatten());
    }

    const existing = await prisma.branches.findUnique({
      where: {
        id: parsed.data.id,
      },
    });

    if (!existing) {
      throw new AppError("الفرع غير موجود", 404);
    }

    const duplicateName = await branchesRepository.findDuplicateName(
      parsed.data.branch_name_ar,
      parsed.data.id
    );

    if (duplicateName) {
      throw new AppError("اسم الفرع موجود مسبقًا", 409);
    }

    return branchesRepository.update(parsed.data.id, {
      // branch_code لا يتم تعديله نهائيًا
      branch_name_ar: parsed.data.branch_name_ar,
      branch_name_en: parsed.data.branch_name_en || null,
      city: parsed.data.city || null,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      is_active: parsed.data.is_active ?? true,
    });
  },

  async deleteBranch(id: string) {
    if (!id) {
      throw new AppError("معرف الفرع مطلوب", 400);
    }

    return branchesRepository.delete(id);
  },
};
