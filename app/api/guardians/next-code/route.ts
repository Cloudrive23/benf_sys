import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { requirePermission } from "@/lib/permissions";
import { guardiansService } from "@/services/guardians/guardians.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const permission = await requirePermission("guardians.create");

    if (!permission.ok) {
      return permission.response!;
    }

    const code = await guardiansService.getNextCode();

    return successResponse(code, "تم جلب رقم المعيل التالي بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
