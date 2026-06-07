import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { getCurrentUser } from "@/lib/auth";
import { sponsorsService } from "@/services/sponsors.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const data = activeOnly
      ? await sponsorsService.listActive()
      : await sponsorsService.list();

    return successResponse(data, "تم تحميل الجهات الكافلة بنجاح", 200, data.length);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await getCurrentUser();

    const data = await sponsorsService.create(body, {
      id: user?.id,
      role: user?.role,
    });

    return successResponse(data, "تمت إضافة الجهة الكافلة بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const user = await getCurrentUser();

    const data = await sponsorsService.update(body, {
      id: user?.id,
      role: user?.role,
    });

    return successResponse(data, "تم تعديل الجهة الكافلة بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";

    await sponsorsService.delete(id);

    return successResponse(null, "تم حذف الجهة الكافلة بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
