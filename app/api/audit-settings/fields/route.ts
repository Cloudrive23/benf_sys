import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { auditSettingsService } from "@/services/audit-settings.service";

import { requirePermission } from "@/lib/permissions";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const permission = await requirePermission("audit_settings.manage");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();

    const data = await auditSettingsService.createField(body);

    return successResponse(data, "تمت إضافة الحقل بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const permission = await requirePermission("audit_settings.manage");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();

    const data = await auditSettingsService.updateField(body);

    return successResponse(data, "تم تعديل الحقل بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const permission = await requirePermission("audit_settings.manage");

    if (!permission.ok) {
      return permission.response!;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";

    await auditSettingsService.disableField(id);

    return successResponse(null, "تم تعطيل الحقل بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
