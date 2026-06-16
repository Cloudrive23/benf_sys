import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { requirePermission } from "@/lib/permissions";
import { branchesService } from "@/services/branches.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const permission = await requirePermission("org.branches.create");

    if (!permission.ok) {
      return permission.response!;
    }

    const code = await branchesService.getNextCode();

    return successResponse(code, "تم جلب رقم الفرع التالي بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
