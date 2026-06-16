import { NextResponse } from "next/server";

import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { getCurrentUserRecord } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { branchesService } from "@/services/branches.service";

export const dynamic = "force-dynamic";

async function requireAnyPermission(permissionCodes: string[]) {
  const user = await getCurrentUserRecord();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: "غير مصرح، يرجى تسجيل الدخول" },
        { status: 401 }
      ),
    };
  }

  for (const permissionCode of permissionCodes) {
    if (await hasPermission(user.id, permissionCode)) {
      return { ok: true };
    }
  }

  return {
    ok: false,
    response: NextResponse.json(
      { success: false, message: "ليس لديك الصلاحية المطلوبة" },
      { status: 403 }
    ),
  };
}

export async function GET() {
  try {
    const permission = await requireAnyPermission([
      "org.branches.view",
      "org.sites.view",
      "org.centers.view",
    ]);

    if (!permission.ok) {
      return permission.response!;
    }

    const items = await branchesService.listBranches();

    return successResponse(
      items,
      "تم تحميل الفروع بنجاح",
      200,
      items.length
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const permission = await requireAnyPermission(["org.branches.create"]);

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();

    const item = await branchesService.createBranch(body);

    return successResponse(item, "تم إنشاء الفروع بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const permission = await requireAnyPermission(["org.branches.update"]);

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();

    const item = await branchesService.updateBranch(body);

    return successResponse(item, "تم تعديل الفروع بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const permission = await requireAnyPermission(["org.branches.delete"]);

    if (!permission.ok) {
      return permission.response!;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    await branchesService.deleteBranch(id || "");

    return successResponse(null, "تم حذف الفروع بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
