import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { duplicateRulesService } from "@/services/duplicate-rules.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const data = await duplicateRulesService.createField(body);

    return successResponse(data, "تمت إضافة حقل المطابقة بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "set_active") {
		  const data = await duplicateRulesService.setFieldActive(
			body.id,
			Boolean(body.is_active)
		  );

		  return successResponse(
			data,
			body.is_active
			  ? "تم تفعيل حقل المطابقة بنجاح"
			  : "تم تعطيل حقل المطابقة بنجاح"
		  );
		}

		const data = await duplicateRulesService.updateField(body);

		return successResponse(data, "تم تعديل حقل المطابقة بنجاح");

    
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";

    await duplicateRulesService.disableField(id);

    return successResponse(null, "تم تعطيل حقل المطابقة بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}