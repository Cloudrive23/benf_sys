import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { themeService } from "@/services/theme.service";

import { requirePermission } from "@/lib/permissions";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await themeService.getTheme();
    return successResponse(data, "تم تحميل إعدادات المظهر بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const permission = await requirePermission("theme.manage");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();
    const data = await themeService.updateTheme(body);
    return successResponse(data, "تم حفظ إعدادات المظهر بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
