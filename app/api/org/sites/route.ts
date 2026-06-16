import { NextResponse } from "next/server";

import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { getCurrentUserRecord } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { sitesService } from "@/services/sites.service";

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
      "org.sites.view",
      "org.centers.view",
    ]);

    if (!permission.ok) {
      return permission.response!;
    }

    const items = await sitesService.listSites();

    return successResponse(
      items,
      "تم تحميل المواقع بنجاح",
      200,
      items.length
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const permission = await requireAnyPermission(["org.sites.create"]);

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();

    const item = await sitesService.createSite(body);

    return successResponse(item, "تم إنشاء المواقع بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const permission = await requireAnyPermission(["org.sites.update"]);

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();

    const item = await sitesService.updateSite(body);

    return successResponse(item, "تم تعديل المواقع بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const permission = await requireAnyPermission(["org.sites.delete"]);

    if (!permission.ok) {
      return permission.response!;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    await sitesService.deleteSite(id || "");

    return successResponse(null, "تم حذف المواقع بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
