import { NextResponse } from "next/server";

import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { AppError } from "@/lib/api-error";
import { getCurrentUserRecord } from "@/lib/auth";
import { duplicateCheckService } from "@/services/duplicate-check.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserRecord();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "غير مصرح، يرجى تسجيل الدخول" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.entityKey) {
      throw new AppError("مفتاح الكيان مطلوب", 400);
    }

    if (!body.data) {
      throw new AppError("بيانات الفحص مطلوبة", 400);
    }

    const result = await duplicateCheckService.check({
      entityKey: body.entityKey,
      data: body.data,
      excludeId: body.excludeId,
    });

    return successResponse(result, "تم فحص التكرار بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
