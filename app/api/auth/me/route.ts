import { NextResponse } from "next/server";

import { getCurrentUserRecord } from "@/lib/auth";
import { getUserEffectivePermissions } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUserRecord();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "غير مصرح، يرجى تسجيل الدخول",
          data: null,
        },
        { status: 401 }
      );
    }

    const permissions = await getUserEffectivePermissions(user.id);

    return NextResponse.json({
      success: true,
      message: "تم تحميل بيانات المستخدم الحالي بنجاح",
      data: {
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          email: user.email,
          is_active: user.is_active,
          is_super_admin: user.is_super_admin,
        },
        permissions,
      },
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء تحميل بيانات المستخدم الحالي",
        data: null,
      },
      { status: 500 }
    );
  }
}
