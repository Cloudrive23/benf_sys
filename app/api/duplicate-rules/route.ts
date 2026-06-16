import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { duplicateRulesService } from "@/services/duplicate-rules.service";

import { requirePermission } from "@/lib/permissions";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const permission = await requirePermission("duplicate_rules.manage");

    if (!permission.ok) {
      return permission.response!;
    }

    const data = await duplicateRulesService.list();

    return successResponse(
      data,
      "تم تحميل سياسات التكرار بنجاح",
      200,
      data.length
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const permission = await requirePermission("duplicate_rules.manage");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();

    const data = await duplicateRulesService.createRule(body);

    return successResponse(data, "تمت إضافة سياسة التكرار بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const permission = await requirePermission("duplicate_rules.manage");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();
	
		if (body.action === "set_active") {
			  const data = await duplicateRulesService.setRuleActive(
				body.id,
				Boolean(body.is_active)
			  );

			  return successResponse(
				data,
				body.is_active
				  ? "تم تفعيل سياسة التكرار بنجاح"
				  : "تم تعطيل سياسة التكرار بنجاح"
			  );
			}

			const data = await duplicateRulesService.updateRule(body);

			return successResponse(data, "تم تعديل سياسة التكرار بنجاح");
 
 } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const permission = await requirePermission("duplicate_rules.manage");

    if (!permission.ok) {
      return permission.response!;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";

    await duplicateRulesService.disableRule(id);

    return successResponse(null, "تم تعطيل سياسة التكرار بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
