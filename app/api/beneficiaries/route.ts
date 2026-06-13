import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { requirePermission } from "@/lib/permissions";
import { beneficiariesService } from "@/services/beneficiaries.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const permission = await requirePermission("beneficiaries.view");

    if (!permission.ok) {
      return permission.response!;
    }

    const beneficiaries = await beneficiariesService.listBeneficiaries();

    return successResponse(
      beneficiaries,
      "تم تحميل المستفيدين بنجاح",
      200,
      beneficiaries.length
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const permission = await requirePermission("beneficiaries.create");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();

    const beneficiary = await beneficiariesService.createBeneficiary(body, {
      id: permission.user?.id,
      role: "user",
    });

    return successResponse(beneficiary, "تم إنشاء المستفيد بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const permission = await requirePermission("beneficiaries.update");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();

    const beneficiary = await beneficiariesService.updateBeneficiary(body, {
      id: permission.user?.id,
      role: "user",
    });

    return successResponse(beneficiary, "تم تعديل المستفيد بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const permission = await requirePermission("beneficiaries.delete");

    if (!permission.ok) {
      return permission.response!;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    await beneficiariesService.deleteBeneficiary(id || "");

    return successResponse(null, "تم حذف المستفيد بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}