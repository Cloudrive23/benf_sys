import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { mothersService } from "@/services/mothers/mothers.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const code = await mothersService.getNextCode();
    return successResponse(code, "تم جلب رقم الأم التالي بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}