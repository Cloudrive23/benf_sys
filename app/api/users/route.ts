import { usersService } from "@/services/users.service";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { requirePermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const permission = await requirePermission("users.view");
    if (!permission.ok) return permission.response!;

    const users = await usersService.listUsers();

    return successResponse(users, "تم تحميل المستخدمين بنجاح", 200, users.length);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const permission = await requirePermission("users.create");
    if (!permission.ok) return permission.response!;

    const contentType = request.headers.get("content-type") || "";
    let body: any;

    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      body = await request.json();
    }

    const user = await usersService.createUser(body);

    return successResponse(user, "تم إنشاء المستخدم بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const permission = await requirePermission("users.update");
    if (!permission.ok) return permission.response!;

    const body = await request.json();
    const user = await usersService.updateUser(body);

    return successResponse(user, "تم تعديل المستخدم بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const permission = await requirePermission("users.delete");
    if (!permission.ok) return permission.response!;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    await usersService.deleteUser(id || "");

    return successResponse(null, "تم حذف المستخدم بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
