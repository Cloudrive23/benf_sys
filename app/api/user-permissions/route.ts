import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { userPermissionsService } from "@/services/user-permissions.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const data = await userPermissionsService.loadPageData(userId);
    return successResponse(data, "تم تحميل صلاحيات المستخدم بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await userPermissionsService.setOverride(body);
    return successResponse(data, "تم حفظ صلاحية المستخدم المباشرة بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const data = await userPermissionsService.setOverride(body);
    return successResponse(data, "تم تحديث صلاحية المستخدم المباشرة بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const data = await userPermissionsService.deleteOverride(
      searchParams.get("user_id"),
      searchParams.get("permission_id")
    );
    return successResponse(data, "تم حذف الاستثناء والعودة لصلاحيات الدور");
  } catch (error) {
    return handleApiError(error);
  }
}
