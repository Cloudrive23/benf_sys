import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { requirePermission } from "@/lib/permissions";
import { centersService } from "@/services/centers.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const permission = await requirePermission("org.centers.create");

    if (!permission.ok) {
      return permission.response!;
    }

    const code = await centersService.getNextCode();

    return successResponse(code, "تم جلب رقم المركز التالي بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
