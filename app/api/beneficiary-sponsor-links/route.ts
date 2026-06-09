import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { beneficiarySponsorLinksService } from "@/services/beneficiary-sponsor-links.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const beneficiaryId = searchParams.get("beneficiary_id");

    const data = await beneficiarySponsorLinksService.listByBeneficiary(beneficiaryId);

    return successResponse(
      data,
      "تم تحميل الجهات المرتبطة بالمستفيد بنجاح",
      200,
      data.length
    );
  } catch (error) {
    return handleApiError(error);
  }
}
