import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { getCurrentUser } from "@/lib/auth";
import { beneficiariesService } from "@/services/beneficiaries.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
    const body = await request.json();
    const user = await getCurrentUser();

    const beneficiary = await beneficiariesService.createBeneficiary(body, {
      id: user?.id,
      role: user?.role,
    });

    return successResponse(beneficiary, "تم إنشاء المستفيد بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const user = await getCurrentUser();

    const beneficiary = await beneficiariesService.updateBeneficiary(body, {
      id: user?.id,
      role: user?.role,
    });

    return successResponse(beneficiary, "تم تعديل المستفيد بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    await beneficiariesService.deleteBeneficiary(id || "");

    return successResponse(null, "تم حذف المستفيد بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
