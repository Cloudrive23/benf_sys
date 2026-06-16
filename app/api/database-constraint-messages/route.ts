import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { databaseConstraintMessagesService } from "@/services/database-constraint-messages.service";

import { requirePermission } from "@/lib/permissions";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const permission = await requirePermission("database_constraint_messages.manage");

    if (!permission.ok) {
      return permission.response!;
    }

    const data = await databaseConstraintMessagesService.list();

    return successResponse(
      data,
      "تم تحميل رسائل قيود قاعدة البيانات بنجاح",
      200,
      data.length
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const permission = await requirePermission("database_constraint_messages.manage");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();

    const data = await databaseConstraintMessagesService.create(body);

    return successResponse(data, "تمت إضافة رسالة القيد بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const permission = await requirePermission("database_constraint_messages.manage");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();

    if (body.action === "set_active") {
      const data = await databaseConstraintMessagesService.setActive(
        body.id,
        Boolean(body.is_active)
      );

      return successResponse(
        data,
        body.is_active
          ? "تم تفعيل رسالة القيد بنجاح"
          : "تم تعطيل رسالة القيد بنجاح"
      );
    }

    const data = await databaseConstraintMessagesService.update(body);

    return successResponse(data, "تم تعديل رسالة القيد بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
