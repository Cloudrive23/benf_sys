import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { requirePermission } from "@/lib/permissions";
import { beneficiaryFieldGroupsService } from "@/services/beneficiary-fields/beneficiary-field-groups.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await beneficiaryFieldGroupsService.list();
    return successResponse(data, "تم تحميل تصنيفات بيانات المستفيد بنجاح");
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
    const data = await beneficiaryFieldGroupsService.create(body);
    return successResponse(data, "تمت إضافة التصنيف بنجاح", 201);
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
    const data = await beneficiaryFieldGroupsService.update(body);
    return successResponse(data, "تم تعديل التصنيف بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}