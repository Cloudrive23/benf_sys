import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { entityDefinitionsService } from "@/services/entity-definitions.service";

import { requirePermission } from "@/lib/permissions";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityKey = searchParams.get("entityKey");

    // تحميل تعريف كيان محدد يستخدمه النظام أثناء التشغيل، لذلك لا نغلقه بصلاحية الإدارة.
    if (entityKey) {
      const data = await entityDefinitionsService.getByKey(entityKey);
      return successResponse(data, "تم تحميل تعريف الكيان بنجاح");
    }

    // قائمة كل التعريفات شاشة إدارية، ولذلك تحتاج صلاحية إدارة تعريفات الكيانات.
    const permission = await requirePermission("entity_definitions.manage");

    if (!permission.ok) {
      return permission.response!;
    }

    const data = await entityDefinitionsService.list();

    return successResponse(
      data,
      "تم تحميل تعريفات الكيانات بنجاح",
      200,
      data.length
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const permission = await requirePermission("entity_definitions.manage");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();

    const data = await entityDefinitionsService.create(body);

    return successResponse(data, "تمت إضافة تعريف الكيان بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const permission = await requirePermission("entity_definitions.manage");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();

    if (body.action === "set_active") {
      const data = await entityDefinitionsService.setEntityActive(
        body.id,
        Boolean(body.is_active)
      );

      return successResponse(
        data,
        body.is_active
          ? "تم تفعيل تعريف الكيان بنجاح"
          : "تم تعطيل تعريف الكيان بنجاح"
      );
    }

    const data = await entityDefinitionsService.update(body);

    return successResponse(data, "تم تعديل تعريف الكيان بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
