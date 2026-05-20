import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { branchesService } from "@/services/branches.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const code = await branchesService.getNextCode();

    return successResponse(code, "تم جلب رقم الفرع التالي بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
