import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { requirePermission } from "@/lib/permissions";
import { rolesService } from "@/services/roles.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const permission = await requirePermission("roles.view");
    if (!permission.ok) return permission.response!;

    const data = await rolesService.loadPageData();
    return successResponse(data, "تم تحميل الأدوار والصلاحيات بنجاح");
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
