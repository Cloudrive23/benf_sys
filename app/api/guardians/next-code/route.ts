import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { guardiansService } from "@/services/guardians/guardians.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const code = await guardiansService.getNextCode();
    return successResponse(code, "?? ??? ??? ?????? ?????? ?????");
  } catch (error) {
    return handleApiError(error);
  }
}