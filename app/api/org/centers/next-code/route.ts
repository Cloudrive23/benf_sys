import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { centersService } from "@/services/centers.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const code = await centersService.getNextCode();
    return successResponse(code, "تم جلب رقم المركز التالي بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}