import { NextResponse } from "next/server";

import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { getCurrentUserRecord } from "@/lib/auth";
import { hasPermission, requirePermission } from "@/lib/permissions";
import { familyMembersService } from "@/services/family-members.service";

export const dynamic = "force-dynamic";

async function requireAnyPermission(permissionCodes: string[]) {
  const user = await getCurrentUserRecord();

  if (!user) {
    return {
      ok: false,
      user: null,
      response: NextResponse.json(
        {
          success: false,
          message: "غير مصرح بالدخول",
        },
        { status: 401 }
      ),
    };
  }

  for (const permissionCode of permissionCodes) {
    const allowed = await hasPermission(user.id, permissionCode);

    if (allowed) {
      return {
        ok: true,
        user,
      };
    }
  }

  return {
    ok: false,
    user,
    response: NextResponse.json(
      {
        success: false,
        message: "ليست لديك الصلاحية المطلوبة",
      },
      { status: 403 }
    ),
  };
}

export async function GET(request: Request) {
  try {
    const permission = await requireAnyPermission([
      "beneficiaries.view",
      "beneficiaries.family.manage",
    ]);

    if (!permission.ok) {
      return permission.response!;
    }

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
    const permission = await requirePermission("beneficiaries.family.manage");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();

    const data = await familyMembersService.create(body, {
      id: permission.user?.id,
      role: "user",
    });

    return successResponse(data, "تمت إضافة فرد الأسرة بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const permission = await requirePermission("beneficiaries.family.manage");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();

    const data = await familyMembersService.update(body, {
      id: permission.user?.id,
      role: "user",
    });

    return successResponse(data, "تم تعديل فرد الأسرة بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const permission = await requirePermission("beneficiaries.family.manage");

    if (!permission.ok) {
      return permission.response!;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";

    await familyMembersService.delete(id, {
      id: permission.user?.id,
      role: "user",
    });

    return successResponse(null, "تم حذف فرد الأسرة بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
