import { NextResponse } from "next/server";

import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { getSuperAdminUserIds, isSuperAdminUser, requirePermission } from "@/lib/permissions";
import { rolesService } from "@/services/roles.service";

export const dynamic = "force-dynamic";

function protectSuperAdminRoleChange(action: string, userId?: string | null) {
  if (action === "add_user") {
    return "لا يمكن إضافة مدير النظام المبرمج إلى الأدوار من داخل النظام لأنه يملك كل الصلاحيات تلقائيًا";
  }

  if (action === "remove_user") {
    return "لا يمكن إزالة أدوار مدير النظام المبرمج من داخل النظام";
  }

  return "لا يمكن تعديل أدوار مدير النظام المبرمج من داخل النظام";
}

async function appendSuperAdminFlags(data: any) {
  const superAdminIds = await getSuperAdminUserIds();

  const roles = (data.roles || []).map((role: any) => ({
    ...role,
    user_roles: (role.user_roles || []).map((item: any) => ({
      ...item,
      users: item.users
        ? {
            ...item.users,
            is_super_admin: superAdminIds.has(item.users.id),
          }
        : item.users,
    })),
  }));

  const users = (data.users || []).map((user: any) => ({
    ...user,
    is_super_admin: superAdminIds.has(user.id),
  }));

  return {
    ...data,
    roles,
    users,
  };
}

export async function GET() {
  try {
    const permission = await requirePermission("roles.view");
    if (!permission.ok) return permission.response!;

    const data = await rolesService.loadPageData();
    return successResponse(
      await appendSuperAdminFlags(data),
      "تم تحميل الأدوار والصلاحيات بنجاح"
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const permission = await requirePermission("roles.create");
    if (!permission.ok) return permission.response!;

    const body = await request.json();
    const data = await rolesService.create(body);
    return successResponse(data, "تمت إضافة الدور بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if ((body.action === "add_user" || body.action === "remove_user") && await isSuperAdminUser(body.user_id)) {
      return NextResponse.json(
        {
          success: false,
          message: protectSuperAdminRoleChange(body.action, body.user_id),
        },
        { status: 403 }
      );
    }

    if (body.action === "set_permissions") {
      const permission = await requirePermission("roles.manage_permissions");
      if (!permission.ok) return permission.response!;

      const data = await rolesService.setPermissions(body);
      return successResponse(data, "تم تحديث صلاحيات الدور بنجاح");
    }

    if (body.action === "add_user") {
      const permission = await requirePermission("roles.manage_users");
      if (!permission.ok) return permission.response!;

      const data = await rolesService.addUser(body);
      return successResponse(data, "تمت إضافة المستخدم إلى الدور بنجاح");
    }

    if (body.action === "remove_user") {
      const permission = await requirePermission("roles.manage_users");
      if (!permission.ok) return permission.response!;

      const data = await rolesService.removeUser(body);
      return successResponse(data, "تمت إزالة المستخدم من الدور بنجاح");
    }

    const permission = await requirePermission("roles.update");
    if (!permission.ok) return permission.response!;

    const data = await rolesService.update(body);
    return successResponse(data, "تم تعديل الدور بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const permission = await requirePermission("roles.delete");
    if (!permission.ok) return permission.response!;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";

    const data = await rolesService.delete(id);
    return successResponse(data, "تم تعطيل الدور بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
