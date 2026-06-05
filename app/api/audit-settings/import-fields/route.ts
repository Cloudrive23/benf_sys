import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { auditSettingsService } from "@/services/audit-settings.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const data = await auditSettingsService.importFields(body);

    return successResponse(
      data,
      `تم استيراد ${data.imported_count} حقل بنجاح`
    );
  } catch (error) {
    return handleApiError(error);
  }
}