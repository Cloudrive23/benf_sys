import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { beneficiaryFieldTabsService } from "@/services/beneficiary-fields/beneficiary-field-tabs.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await beneficiaryFieldTabsService.list();
    return successResponse(data, "تم تحميل تبويبات المستفيد بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await beneficiaryFieldTabsService.create(body);
    return successResponse(data, "تمت إضافة التبويب بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const data = await beneficiaryFieldTabsService.update(body);
    return successResponse(data, "تم تعديل التبويب بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}