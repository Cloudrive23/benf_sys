import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { getCurrentUser } from "@/lib/auth";
import { fathersService } from "@/services/fathers/fathers.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fathersService.listFathers();

    return successResponse(
      data,
      "تم تحميل بيانات الآباء بنجاح",
      200,
      data.length
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await getCurrentUser();

    const father = await fathersService.createFather(
      body,
      user,
      Boolean(body.allowDuplicateWarning)
    );

    return successResponse(father, "تمت إضافة الأب بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const user = await getCurrentUser();

    const father = await fathersService.updateFather(
      body,
      user,
      Boolean(body.allowDuplicateWarning)
    );

    return successResponse(father, "تم تعديل بيانات الأب بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";
    const user = await getCurrentUser();

    await fathersService.deleteFather(id, user);

    return successResponse(null, "تم حذف الأب بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}