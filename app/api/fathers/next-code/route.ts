import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { requirePermission } from "@/lib/permissions";
import { fathersService } from "@/services/fathers/fathers.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const permission = await requirePermission("fathers.create");

    if (!permission.ok) {
      return permission.response!;
    }

    const code = await fathersService.getNextCode();

    return successResponse(code, "تم جلب رقم الأب التالي بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
