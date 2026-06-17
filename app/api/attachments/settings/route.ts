// app/api/attachments/settings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

/**
 * تحويل النص الفارغ إلى null
 */
function emptyToNull(value: unknown) {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return value;
}

/**
 * استجابة نجاح موحدة
 */
function ok(data: unknown, message = "تمت العملية بنجاح", status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

/**
 * استجابة خطأ موحدة
 */
function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      message,
      details,
    },
    { status }
  );
}

/**
 * تجهيز بيانات إعداد المرفقات
 */
function mapSettingPayload(body: any) {
  return {
    setting_key: String(body.setting_key ?? "").trim(),
    setting_value:
      body.setting_value === undefined || body.setting_value === null
        ? null
        : String(body.setting_value).trim(),

    setting_type: String(body.setting_type ?? "string").trim(),

    scope_type: String(body.scope_type ?? "global").trim(),
    scope_code: emptyToNull(body.scope_code) as string | null,

    description: emptyToNull(body.description) as string | null,

    is_locked: Boolean(body.is_locked ?? false),
    is_active: Boolean(body.is_active ?? true),
  };
}

/**
 * التحقق الأساسي من البيانات
 */
function validateSettingPayload(data: ReturnType<typeof mapSettingPayload>) {
  if (!data.setting_key) {
    return "مفتاح الإعداد مطلوب";
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(data.setting_key)) {
    return "مفتاح الإعداد يجب أن يحتوي على حروف إنجليزية أو أرقام أو نقطة أو شرطة أو شرطة سفلية فقط";
  }

  const allowedTypes = ["string", "number", "boolean", "json", "path"];

  if (!allowedTypes.includes(data.setting_type)) {
    return "نوع الإعداد غير صحيح";
  }

  const allowedScopes = ["global", "section", "entity", "type"];

  if (!allowedScopes.includes(data.scope_type)) {
    return "نطاق الإعداد غير صحيح";
  }

  if (data.setting_type === "number" && data.setting_value !== null) {
    const n = Number(data.setting_value);
    if (!Number.isFinite(n)) {
      return "قيمة الإعداد الرقمية غير صحيحة";
    }
  }

  if (data.setting_type === "boolean" && data.setting_value !== null) {
    const v = String(data.setting_value).toLowerCase();
    if (!["true", "false", "1", "0", "yes", "no"].includes(v)) {
      return "قيمة الإعداد المنطقية يجب أن تكون true أو false";
    }
  }

  if (data.setting_type === "json" && data.setting_value !== null) {
    try {
      JSON.parse(data.setting_value);
    } catch {
      return "قيمة JSON غير صحيحة";
    }
  }

  return null;
}

/**
 * GET /api/attachments/settings
 * عرض إعدادات المرفقات
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const includeInactive = searchParams.get("includeInactive") === "true";
    const scopeType = searchParams.get("scope_type");
    const scopeCode = searchParams.get("scope_code");

    const where: any = {};

    if (!includeInactive) {
      where.is_active = true;
    }

    if (scopeType) {
      where.scope_type = scopeType;
    }

    if (scopeCode) {
      where.scope_code = scopeCode;
    }

    const rows = await prisma.attachment_settings.findMany({
      where,
      orderBy: [{ scope_type: "asc" }, { setting_key: "asc" }],
    });

    return ok(rows, "تم جلب إعدادات المرفقات بنجاح");
  } catch (error: any) {
    console.error("GET /api/attachments/settings error:", error);
    return fail("حدث خطأ أثناء جلب إعدادات المرفقات", 500, error?.message);
  }
}

/**
 * POST /api/attachments/settings
 * إضافة إعداد جديد
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = mapSettingPayload(body);

    const validationError = validateSettingPayload(data);
    if (validationError) {
      return fail(validationError, 400);
    }

    const exists = await prisma.attachment_settings.findUnique({
      where: {
        setting_key: data.setting_key,
      },
    });

    if (exists) {
      return fail("مفتاح الإعداد موجود مسبقًا", 409);
    }

    const created = await prisma.attachment_settings.create({
      data,
    });

    return ok(created, "تمت إضافة إعداد المرفقات بنجاح", 201);
  } catch (error: any) {
    console.error("POST /api/attachments/settings error:", error);
    return fail("حدث خطأ أثناء إضافة إعداد المرفقات", 500, error?.message);
  }
}

/**
 * PUT /api/attachments/settings
 * تعديل إعداد
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return fail("معرف الإعداد مطلوب للتعديل", 400);
    }

    const id = String(body.id);

    const oldRow = await prisma.attachment_settings.findUnique({
      where: { id },
    });

    if (!oldRow) {
      return fail("إعداد المرفقات غير موجود", 404);
    }

    if (oldRow.is_locked && body.setting_key !== oldRow.setting_key) {
      return fail("لا يمكن تغيير مفتاح إعداد مقفل", 403);
    }

    const data = mapSettingPayload(body);

    const validationError = validateSettingPayload(data);
    if (validationError) {
      return fail(validationError, 400);
    }

    const keyExists = await prisma.attachment_settings.findFirst({
      where: {
        setting_key: data.setting_key,
        NOT: {
          id,
        },
      },
    });

    if (keyExists) {
      return fail("مفتاح الإعداد مستخدم في سجل آخر", 409);
    }

    const updated = await prisma.attachment_settings.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });

    return ok(updated, "تم تعديل إعداد المرفقات بنجاح");
  } catch (error: any) {
    console.error("PUT /api/attachments/settings error:", error);
    return fail("حدث خطأ أثناء تعديل إعداد المرفقات", 500, error?.message);
  }
}

/**
 * DELETE /api/attachments/settings?id=...
 * تعطيل إعداد بدل الحذف الفعلي
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return fail("معرف الإعداد مطلوب للحذف", 400);
    }

    const oldRow = await prisma.attachment_settings.findUnique({
      where: { id },
    });

    if (!oldRow) {
      return fail("إعداد المرفقات غير موجود", 404);
    }

    if (oldRow.is_locked) {
      return fail("لا يمكن تعطيل إعداد مقفل", 403);
    }

    const disabled = await prisma.attachment_settings.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });

    return ok(disabled, "تم تعطيل إعداد المرفقات بنجاح");
  } catch (error: any) {
    console.error("DELETE /api/attachments/settings error:", error);
    return fail("حدث خطأ أثناء تعطيل إعداد المرفقات", 500, error?.message);
  }
}