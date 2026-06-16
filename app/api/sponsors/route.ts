import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { requirePermission } from "@/lib/permissions";
import { sponsorsService } from "@/services/sponsors.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const permission = await requirePermission("sponsors.view");

    if (!permission.ok) {
      return permission.response!;
    }

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
    const permission = await requirePermission("sponsors.create");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();

    const data = await sponsorsService.create(body, {
      id: permission.user?.id,
      role: "user",
    });

    return successResponse(data, "تمت إضافة الجهة الكافلة بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const permission = await requirePermission("sponsors.update");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();

    const data = await sponsorsService.update(body, {
      id: permission.user?.id,
      role: "user",
    });

    return successResponse(data, "تم تعديل الجهة الكافلة بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const permission = await requirePermission("sponsors.delete");

    if (!permission.ok) {
      return permission.response!;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";

    await sponsorsService.delete(id);

    return successResponse(null, "تم حذف الجهة الكافلة بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
