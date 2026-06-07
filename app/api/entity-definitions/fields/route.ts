import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { entityDefinitionsService } from "@/services/entity-definitions.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const data = await entityDefinitionsService.createField(body);

    return successResponse(data, "تمت إضافة تعريف الحقل بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "set_active") {
      const data = await entityDefinitionsService.setFieldActive(
        body.id,
        Boolean(body.is_active)
      );

      return successResponse(
        data,
        body.is_active
          ? "تم تفعيل تعريف الحقل بنجاح"
          : "تم تعطيل تعريف الحقل بنجاح"
      );
    }

    const data = await entityDefinitionsService.updateField(body);

    return successResponse(data, "تم تعديل تعريف الحقل بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}