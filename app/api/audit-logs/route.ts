import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { auditLogRepository } from "@/repositories/audit-log.repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const entityType = searchParams.get("entity_type");
    const entityId = searchParams.get("entity_id");

    let data = [];

    if (entityType && entityId) {
      data = await auditLogRepository.findByEntity(
        entityType,
        entityId
      );
    } else {
      data = await auditLogRepository.findRecent(100);
    }

    return successResponse(data, "تم تحميل سجل التغييرات", 200, data.length);
  } catch (error) {
    return handleApiError(error);
  }
}