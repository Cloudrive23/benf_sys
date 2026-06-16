import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { entityDefinitionsService } from "@/services/entity-definitions.service";

import { requirePermission } from "@/lib/permissions";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const permission = await requirePermission("entity_definitions.manage");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();

    const data = await entityDefinitionsService.importFields(body.entity_id);

    return successResponse(data, "تم استيراد حقول الكيان بنجاح", 200, data.length);
  } catch (error) {
    return handleApiError(error);
  }
}
