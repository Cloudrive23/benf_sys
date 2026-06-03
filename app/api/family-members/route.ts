import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { familyMembersService } from "@/services/family-members.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const beneficiaryId = searchParams.get("beneficiary_id");

    const data = await familyMembersService.list(beneficiaryId || undefined);

    return successResponse(data, "تم تحميل أفراد الأسرة بنجاح", 200, data.length);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await familyMembersService.create(body);

    return successResponse(data, "تمت إضافة فرد الأسرة بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const data = await familyMembersService.update(body);

    return successResponse(data, "تم تعديل فرد الأسرة بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}