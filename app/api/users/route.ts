import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { usersService } from "@/services/users.service";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { isSuperAdminUser, markSuperAdmins, requirePermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

function stripSuperAdminFields(data: any) {
  if (!data || typeof data !== "object") return data;

  const clean = { ...data };
  delete clean.is_super_admin;
  delete clean.super_admin;
  return clean;
}

async function rejectIfTargetIsSuperAdmin(userId?: string | null) {
  if (!userId) return null;

  if (await isSuperAdminUser(userId)) {
    return NextResponse.json(
      {
        success: false,
        message: "لا يمكن تعديل أو حذف حساب مدير النظام المبرمج من داخل النظام",
      },
      { status: 403 }
    );
  }

  return null;
}

export async function GET() {
  try {
    const permission = await requirePermission("users.view");
    if (!permission.ok) return permission.response!;

    const users = await usersService.listUsers();
    const data = await markSuperAdmins(users as any[]);

    return successResponse(data, "تم تحميل المستخدمين بنجاح", 200, data.length);
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

    const user = await usersService.createUser(stripSuperAdminFields(body));

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
    const blocked = await rejectIfTargetIsSuperAdmin(body?.id);
    if (blocked) return blocked;

    const user = await usersService.updateUser(stripSuperAdminFields(body));

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

    const blocked = await rejectIfTargetIsSuperAdmin(id);
    if (blocked) return blocked;

    await usersService.deleteUser(id || "");

    return successResponse(null, "تم حذف المستخدم بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
