import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { sitesService } from "@/services/sites.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const code = await sitesService.getNextCode();
    return successResponse(code, "تم جلب رقم الموقع التالي بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}