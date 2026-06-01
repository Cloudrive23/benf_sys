import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { mothersService } from "@/services/mothers/mothers.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await mothersService.listMothers();
    return successResponse(data, "تم تحميل بيانات الأمهات بنجاح", 200, data.length);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mother = await mothersService.createMother(body);
    return successResponse(mother, "تمت إضافة الأم بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const mother = await mothersService.updateMother(body);
    return successResponse(mother, "تم تعديل بيانات الأم بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";

    await mothersService.deleteMother(id);

    return successResponse(null, "تم حذف الأم بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}