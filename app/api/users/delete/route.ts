import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const permission = await requirePermission("users.delete");
    if (!permission.ok) return permission.response!;

    const formData = await request.formData();
    const id = String(formData.get("id") || "");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "معرف المستخدم مطلوب" },
        { status: 400 }
      );
    }

    await prisma.users.delete({
      where: { id },
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/users`);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "فشل حذف المستخدم" },
      { status: 500 }
    );
  }
}
