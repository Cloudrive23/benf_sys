// app/api/attachments/sections/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

/**
 * تحويل النص الفارغ إلى null حتى لا نخزن قيم فارغة غير مفيدة
 */
function emptyToNull(value: unknown) {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return value;
}

/**
 * توحيد شكل الاستجابة الناجحة
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
 * توحيد شكل استجابة الخطأ
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
 * تجهيز البيانات المسموح بإدخالها أو تعديلها
 */
function mapSectionPayload(body: any) {
  return {
    section_code: String(body.section_code ?? "").trim(),
    section_name_ar: String(body.section_name_ar ?? "").trim(),
    section_name_en: emptyToNull(body.section_name_en) as string | null,

    entity_type: emptyToNull(body.entity_type) as string | null,

    storage_folder: String(body.storage_folder ?? "").trim(),
    path_template: String(body.path_template ?? "").trim(),

    default_allowed_extensions: emptyToNull(body.default_allowed_extensions) as
      | string
      | null,
    default_allowed_mime_types: emptyToNull(body.default_allowed_mime_types) as
      | string
      | null,

    default_max_file_size_mb:
      body.default_max_file_size_mb === undefined ||
      body.default_max_file_size_mb === null ||
      body.default_max_file_size_mb === ""
        ? null
        : Number(body.default_max_file_size_mb),

    default_min_width:
      body.default_min_width === undefined ||
      body.default_min_width === null ||
      body.default_min_width === ""
        ? null
        : Number(body.default_min_width),

    default_max_width:
      body.default_max_width === undefined ||
      body.default_max_width === null ||
      body.default_max_width === ""
        ? null
        : Number(body.default_max_width),

    default_min_height:
      body.default_min_height === undefined ||
      body.default_min_height === null ||
      body.default_min_height === ""
        ? null
        : Number(body.default_min_height),

    default_max_height:
      body.default_max_height === undefined ||
      body.default_max_height === null ||
      body.default_max_height === ""
        ? null
        : Number(body.default_max_height),

    allow_multiple: Boolean(body.allow_multiple ?? false),

    sort_order:
      body.sort_order === undefined ||
      body.sort_order === null ||
      body.sort_order === ""
        ? 0
        : Number(body.sort_order),

    is_active: Boolean(body.is_active ?? true),

    notes: emptyToNull(body.notes) as string | null,
  };
}

/**
 * التحقق الأساسي
 */
function validateSectionPayload(data: ReturnType<typeof mapSectionPayload>) {
  if (!data.section_code) {
    return "كود القسم مطلوب";
  }

  if (!/^[a-zA-Z0-9_]+$/.test(data.section_code)) {
    return "كود القسم يجب أن يحتوي على حروف إنجليزية أو أرقام أو شرطة سفلية فقط";
  }

  if (!data.section_name_ar) {
    return "اسم القسم بالعربية مطلوب";
  }

  if (!data.storage_folder) {
    return "مجلد التخزين مطلوب";
  }

  if (!data.path_template) {
    return "قالب المسار مطلوب";
  }

  if (
    data.default_max_file_size_mb !== null &&
    (!Number.isFinite(data.default_max_file_size_mb) ||
      data.default_max_file_size_mb <= 0)
  ) {
    return "الحجم الأقصى يجب أن يكون رقمًا أكبر من صفر";
  }

  return null;
}

/**
 * GET /api/attachments/sections
 * عرض أقسام المرفقات
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const includeInactive = searchParams.get("includeInactive") === "true";
    const entityType = searchParams.get("entity_type");

    const where: any = {};

    if (!includeInactive) {
      where.is_active = true;
    }

    if (entityType) {
      where.OR = [{ entity_type: entityType }, { entity_type: "any" }];
    }

    const rows = await prisma.attachment_sections.findMany({
      where,
      orderBy: [{ sort_order: "asc" }, { section_name_ar: "asc" }],
    });

    return ok(rows, "تم جلب أقسام المرفقات بنجاح");
  } catch (error: any) {
    console.error("GET /api/attachments/sections error:", error);
    return fail("حدث خطأ أثناء جلب أقسام المرفقات", 500, error?.message);
  }
}

/**
 * POST /api/attachments/sections
 * إضافة قسم مرفقات جديد
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = mapSectionPayload(body);

    const validationError = validateSectionPayload(data);
    if (validationError) {
      return fail(validationError, 400);
    }

    const exists = await prisma.attachment_sections.findUnique({
      where: {
        section_code: data.section_code,
      },
    });

    if (exists) {
      return fail("كود القسم موجود مسبقًا", 409);
    }

    const created = await prisma.attachment_sections.create({
      data,
    });

    return ok(created, "تمت إضافة قسم المرفقات بنجاح", 201);
  } catch (error: any) {
    console.error("POST /api/attachments/sections error:", error);
    return fail("حدث خطأ أثناء إضافة قسم المرفقات", 500, error?.message);
  }
}

/**
 * PUT /api/attachments/sections
 * تعديل قسم مرفقات
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return fail("معرف القسم مطلوب للتعديل", 400);
    }

    const id = String(body.id);

    const oldRow = await prisma.attachment_sections.findUnique({
      where: { id },
    });

    if (!oldRow) {
      return fail("قسم المرفقات غير موجود", 404);
    }

    const data = mapSectionPayload(body);

    const validationError = validateSectionPayload(data);
    if (validationError) {
      return fail(validationError, 400);
    }

    const codeExists = await prisma.attachment_sections.findFirst({
      where: {
        section_code: data.section_code,
        NOT: {
          id,
        },
      },
    });

    if (codeExists) {
      return fail("كود القسم مستخدم في سجل آخر", 409);
    }

    const updated = await prisma.attachment_sections.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });

    return ok(updated, "تم تعديل قسم المرفقات بنجاح");
  } catch (error: any) {
    console.error("PUT /api/attachments/sections error:", error);
    return fail("حدث خطأ أثناء تعديل قسم المرفقات", 500, error?.message);
  }
}

/**
 * DELETE /api/attachments/sections?id=...
 * تعطيل قسم مرفقات بدل الحذف الفعلي
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return fail("معرف القسم مطلوب للحذف", 400);
    }

    const oldRow = await prisma.attachment_sections.findUnique({
      where: { id },
    });

    if (!oldRow) {
      return fail("قسم المرفقات غير موجود", 404);
    }

    const usedByTypes = await prisma.attachment_types.count({
      where: {
        section_id: id,
      },
    });

    if (usedByTypes > 0) {
      const disabled = await prisma.attachment_sections.update({
        where: { id },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
      });

      return ok(
        disabled,
        "تم تعطيل القسم لأنه مرتبط بأنواع مرفقات ولا يمكن حذفه نهائيًا"
      );
    }

    const disabled = await prisma.attachment_sections.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });

    return ok(disabled, "تم تعطيل قسم المرفقات بنجاح");
  } catch (error: any) {
    console.error("DELETE /api/attachments/sections error:", error);
    return fail("حدث خطأ أثناء تعطيل قسم المرفقات", 500, error?.message);
  }
}