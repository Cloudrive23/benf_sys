import { NextResponse } from "next/server";

import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { getSuperAdminUserIds, isSuperAdminUser, requirePermission } from "@/lib/permissions";
import { userPermissionsService } from "@/services/user-permissions.service";

export const dynamic = "force-dynamic";

async function appendSuperAdminFlags(data: any) {
  const superAdminIds = await getSuperAdminUserIds();

  return {
    ...data,
    users: (data.users || []).map((user: any) => ({
      ...user,
      is_super_admin: superAdminIds.has(user.id),
    })),
    selected_user: data.selected_user
      ? {
          ...data.selected_user,
          is_super_admin: superAdminIds.has(data.selected_user.id),
        }
      : data.selected_user,
  };
}

async function blockIfTargetSuperAdmin(userId?: string | null) {
  if (!userId) return null;

  if (await isSuperAdminUser(userId)) {
    return NextResponse.json(
      {
        success: false,
        message: "لا يمكن إضافة أو تعديل أو حذف صلاحيات مدير النظام المبرمج من داخل النظام",
      },
      { status: 403 }
    );
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const permission = await requirePermission("users.manage_permissions");
    if (!permission.ok) return permission.response!;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const data = await userPermissionsService.loadPageData(userId);
    return successResponse(await appendSuperAdminFlags(data), "تم تحميل صلاحيات المستخدم بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const permission = await requirePermission("users.manage_permissions");
    if (!permission.ok) return permission.response!;

    const body = await request.json();
    const blocked = await blockIfTargetSuperAdmin(body.user_id);
    if (blocked) return blocked;

    const data = await userPermissionsService.setOverride(body);
    return successResponse(await appendSuperAdminFlags(data), "تم حفظ صلاحية المستخدم المباشرة بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const permission = await requirePermission("users.manage_permissions");
    if (!permission.ok) return permission.response!;

    const body = await request.json();
    const blocked = await blockIfTargetSuperAdmin(body.user_id);
    if (blocked) return blocked;

    const data = await userPermissionsService.setOverride(body);
    return successResponse(await appendSuperAdminFlags(data), "تم تحديث صلاحية المستخدم المباشرة بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const permission = await requirePermission("users.manage_permissions");
    if (!permission.ok) return permission.response!;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    const blocked = await blockIfTargetSuperAdmin(userId);
    if (blocked) return blocked;

    const data = await userPermissionsService.deleteOverride(
      userId,
      searchParams.get("permission_id")
    );
    return successResponse(await appendSuperAdminFlags(data), "تم حذف الاستثناء والعودة لصلاحيات الدور");
  } catch (error) {
    return handleApiError(error);
  }
}
