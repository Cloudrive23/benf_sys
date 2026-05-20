import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { branchesService } from "@/services/branches.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const branches = await branchesService.listBranches();

    return successResponse(
      branches,
      "تم تحميل الفروع بنجاح",
      200,
      branches.length
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const branch = await branchesService.createBranch(body);

    return successResponse(branch, "تم إنشاء الفرع بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const branch = await branchesService.updateBranch(body);

    return successResponse(branch, "تم تعديل الفرع بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    await branchesService.deleteBranch(id || "");

    return successResponse(null, "تم حذف الفرع بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
