import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/lib/api-error";
import { branchesRepository } from "@/repositories/branches.repository";
import { auditService } from "@/services/audit.service";

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

    const branch = await branchesRepository.create({
		  branch_code,
		  branch_name_ar: parsed.data.branch_name_ar,
		  branch_name_en: parsed.data.branch_name_en || null,
		  city: parsed.data.city || null,
		  address: parsed.data.address || null,
		  phone: parsed.data.phone || null,
		  is_active: parsed.data.is_active ?? true,
		});

		await auditService.log({
		  action: "CREATE",
		  entityName: "branches",
		  entityId: branch.id,
		  newData: branch,
		  notes: "تم إنشاء فرع جديد",
		});

return branch;
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

    const oldBranch = await prisma.branches.findUnique({
  where: {
    id: parsed.data.id,
  },
});

		const branch = await branchesRepository.update(parsed.data.id, {
			  branch_name_ar: parsed.data.branch_name_ar,
			  branch_name_en: parsed.data.branch_name_en || null,
			  city: parsed.data.city || null,
			  address: parsed.data.address || null,
			  phone: parsed.data.phone || null,
			  is_active: parsed.data.is_active ?? true,
			});

			await auditService.log({
			  action: "UPDATE",
			  entityName: "branches",
			  entityId: branch.id,
			  oldData: oldBranch,
			  newData: branch,
			  notes: "تم تعديل بيانات فرع",
			});

			return branch;
  },

  async deleteBranch(id: string) {
		  if (!id) {
			throw new AppError("معرف الفرع مطلوب", 400);
		  }

		  const sitesCount = await prisma.sites.count({
			where: {
			  branch_id: id,
			},
		  });

		  if (sitesCount > 0) {
			throw new AppError(
			  "لا يمكن حذف الفرع لأنه مرتبط بمواقع. قم بتعطيله بدل الحذف.",
			  400
			);
		  }

		  const oldBranch = await prisma.branches.findUnique({
			where: { id },
		  });

		  const deleted = await branchesRepository.delete(id);

		  await auditService.log({
			action: "DELETE",
			entityName: "branches",
			entityId: id,
			oldData: oldBranch,
			notes: "تم حذف فرع",
		  });

		  return deleted;
		},
};
