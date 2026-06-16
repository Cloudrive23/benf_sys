import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { getCurrentUser } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { mothersService } from "@/services/mothers/mothers.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const permission = await requirePermission("mothers.view");

    if (!permission.ok) {
      return permission.response!;
    }

    const data = await mothersService.listMothers();

    return successResponse(
      data,
      "تم تحميل بيانات الأمهات بنجاح",
      200,
      data.length
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const permission = await requirePermission("mothers.create");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();
    const user = await getCurrentUser();

    const mother = await mothersService.createMother(
      body,
      user,
      Boolean(body.allowDuplicateWarning)
    );

    return successResponse(mother, "تمت إضافة الأم بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const permission = await requirePermission("mothers.update");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();
    const user = await getCurrentUser();

    const mother = await mothersService.updateMother(
      body,
      user,
      Boolean(body.allowDuplicateWarning)
    );

    return successResponse(mother, "تم تعديل بيانات الأم بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const permission = await requirePermission("mothers.delete");

    if (!permission.ok) {
      return permission.response!;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";
    const user = await getCurrentUser();

    await mothersService.deleteMother(id, user);

    return successResponse(null, "تم حذف الأم بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
