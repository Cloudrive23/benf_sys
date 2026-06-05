import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { auditSettingsService } from "@/services/audit-settings.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await auditSettingsService.list();

    return successResponse(
      data,
      "تم تحميل إعدادات سجل التغييرات بنجاح",
      200,
      data.length
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const data = await auditSettingsService.createEntity(body);

    return successResponse(data, "تمت إضافة الكيان بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const data = await auditSettingsService.updateEntity(body);

    return successResponse(data, "تم تعديل الكيان بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";

    await auditSettingsService.disableEntity(id);

    return successResponse(null, "تم تعطيل الكيان بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}