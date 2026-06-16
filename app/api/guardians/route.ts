import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { requirePermission } from "@/lib/permissions";
import { guardiansService } from "@/services/guardians/guardians.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const permission = await requirePermission("guardians.view");

    if (!permission.ok) {
      return permission.response!;
    }

    const data = await guardiansService.listGuardians();
    return successResponse(data, "تم تحميل بيانات المعيلين بنجاح", 200, data.length);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const permission = await requirePermission("guardians.create");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();
    const guardian = await guardiansService.createGuardian(body);
    return successResponse(guardian, "تمت إضافة المعيل بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const permission = await requirePermission("guardians.update");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();
    const guardian = await guardiansService.updateGuardian(body);
    return successResponse(guardian, "تم تعديل بيانات المعيل بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const permission = await requirePermission("guardians.delete");

    if (!permission.ok) {
      return permission.response!;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";

    await guardiansService.deleteGuardian(id);

    return successResponse(null, "تم حذف المعيل بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
