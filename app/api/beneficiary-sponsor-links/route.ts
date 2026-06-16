import { NextResponse } from "next/server";

import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { getCurrentUserRecord } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { beneficiarySponsorLinksService } from "@/services/beneficiary-sponsor-links.service";

export const dynamic = "force-dynamic";

type PermissionCheckResult = {
  ok: boolean;
  response?: NextResponse;
};

async function requireAnyPermission(
  permissionCodes: string[]
): Promise<PermissionCheckResult> {
  const user = await getCurrentUserRecord();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          message: "غير مصرح بالدخول، يرجى تسجيل الدخول",
          data: null,
        },
        { status: 401 }
      ),
    };
  }

  for (const permissionCode of permissionCodes) {
    const allowed = await hasPermission(user.id, permissionCode);

    if (allowed) {
      return { ok: true };
    }
  }

  return {
    ok: false,
    response: NextResponse.json(
      {
        success: false,
        message: "ليست لديك الصلاحية المطلوبة لتنفيذ هذه العملية",
        data: null,
      },
      { status: 403 }
    ),
  };
}

export async function GET(request: Request) {
  try {
    const permission = await requireAnyPermission([
      "beneficiaries.view",
      "beneficiaries.sponsor_links.view",
      "beneficiaries.sponsor_links.manage",
    ]);

    if (!permission.ok) {
      return permission.response!;
    }

    const { searchParams } = new URL(request.url);
    const beneficiaryId = searchParams.get("beneficiary_id");

    const data = await beneficiarySponsorLinksService.listByBeneficiary(
      beneficiaryId
    );

    return successResponse(
      data,
      "تم تحميل الجهات المرتبطة بالمستفيد بنجاح",
      200,
      data.length
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST() {
  const permission = await requireAnyPermission([
    "beneficiaries.sponsor_links.manage",
  ]);

  if (!permission.ok) {
    return permission.response!;
  }

  return NextResponse.json(
    {
      success: false,
      message:
        "إضافة علاقة جهة داعمة بالمستفيد تتم حاليًا من شاشة الكفالات عند إنشاء الكفالة، وليست مفعّلة مباشرة من هذا المسار.",
      data: null,
    },
    { status: 405 }
  );
}

export async function PUT() {
  const permission = await requireAnyPermission([
    "beneficiaries.sponsor_links.manage",
  ]);

  if (!permission.ok) {
    return permission.response!;
  }

  return NextResponse.json(
    {
      success: false,
      message:
        "تعديل علاقة جهة داعمة بالمستفيد غير مفعّل مباشرة من هذا المسار حاليًا.",
      data: null,
    },
    { status: 405 }
  );
}

export async function DELETE() {
  const permission = await requireAnyPermission([
    "beneficiaries.sponsor_links.manage",
  ]);

  if (!permission.ok) {
    return permission.response!;
  }

  return NextResponse.json(
    {
      success: false,
      message:
        "حذف علاقة جهة داعمة بالمستفيد غير مفعّل مباشرة من هذا المسار حاليًا.",
      data: null,
    },
    { status: 405 }
  );
}
