import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { centersService } from "@/services/centers.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const centers = await centersService.listCenters();
    return successResponse(centers, "تم تحميل المراكز بنجاح", 200, centers.length);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const center = await centersService.createCenter(body);
    return successResponse(center, "تم إنشاء المركز بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const center = await centersService.updateCenter(body);
    return successResponse(center, "تم تعديل المركز بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    await centersService.deleteCenter(id || "");

    return successResponse(null, "تم حذف المركز بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}